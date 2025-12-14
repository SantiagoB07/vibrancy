// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { sendOrderConfirmationEmail } from "@/lib/email";

export const runtime = "nodejs";

// Supabase server-side client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; //antes anon
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mercado Pago client
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || "",
});

type CheckoutItem = {
    productId: number;
    productVariantId?: number | null;
    quantity: number;
    selectedAddons?: number[]; // IDs de addons seleccionados
    title: string;
    personalizationFront?: string | null;
    personalizationBack?: string | null;

    photos?: {
        storagePath: string;     // ruta dentro del bucket
        publicUrl?: string | null;
        position: number;        // 1,2,3
    }[];

    engravingFont?: string | null;
};


type CustomerData = {
    name: string;
    phone: string;
    email?: string | null;
    address: string;
    neighborhood?: string | null;
    locality?: string | null;
};

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            customerId,
            customerData,
            items,
        }: {
            customerId?: number | null;
            customerData?: CustomerData;
            items: CheckoutItem[];
        } = body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "No se enviaron ítems para la orden" },
                { status: 400 }
            );
        }

        const currency = "COP";

        // 1) Validar precios desde la base de datos (seguridad)
        const productIds = items.map(item => item.productId);
        const variantIds = items
            .filter(item => item.productVariantId)
            .map(item => item.productVariantId);

        // Recopilar todos los addon IDs de todos los items
        const allAddonIds = items.flatMap(item => item.selectedAddons || []);

        // Obtener precios reales de productos
        const { data: products, error: productsError } = await supabase
            .from("products")
            .select("id, price")
            .in("id", productIds);

        if (productsError || !products) {
            console.error("Error obteniendo productos:", productsError);
            return NextResponse.json(
                { error: "Error validando productos" },
                { status: 500 }
            );
        }

        // Obtener precios de variantes si existen (price_override puede ser null)
        let variants: { id: number; price_override: number | null }[] = [];
        if (variantIds.length > 0) {
            const { data: variantsData, error: variantsError } = await supabase
                .from("product_variants")
                .select("id, price_override")
                .in("id", variantIds);

            if (variantsError) {
                console.error("Error obteniendo variantes:", variantsError);
                return NextResponse.json(
                    { error: "Error validando variantes de productos" },
                    { status: 500 }
                );
            }
            variants = variantsData || [];
        }

        // Obtener precios de addons si existen
        let addons: { id: number; product_id: number; price: number }[] = [];
        if (allAddonIds.length > 0) {
            const { data: addonsData, error: addonsError } = await supabase
                .from("product_addons")
                .select("id, product_id, price")
                .in("id", allAddonIds)
                .eq("active", true);

            if (addonsError) {
                console.error("Error obteniendo addons:", addonsError);
                return NextResponse.json(
                    { error: "Error validando addons de productos" },
                    { status: 500 }
                );
            }
            addons = addonsData || [];
        }

        // Crear mapas de precios
        const productPriceMap = new Map(products.map(p => [p.id, p.price]));
        const variantPriceMap = new Map(variants.map(v => [v.id, v.price_override]));
        const addonMap = new Map(addons.map(a => [a.id, { product_id: a.product_id, price: a.price }]));

        // Validar y usar precios del servidor
        const validatedItems = items.map(item => {
            // Precio base del producto o variante
            let basePrice: number;

            if (item.productVariantId && variantPriceMap.has(item.productVariantId)) {
                // Usar price_override de variante si existe, sino usar precio base del producto
                const variantPrice = variantPriceMap.get(item.productVariantId);
                basePrice = variantPrice ?? productPriceMap.get(item.productId) ?? 0;
            } else {
                // Usar precio del producto
                basePrice = productPriceMap.get(item.productId) ?? 0;
            }

            // Calcular precio de addons seleccionados
            let addonsTotal = 0;
            if (item.selectedAddons && item.selectedAddons.length > 0) {
                for (const addonId of item.selectedAddons) {
                    const addonData = addonMap.get(addonId);
                    if (addonData) {
                        // Validar que el addon pertenece al producto correcto
                        if (addonData.product_id === item.productId) {
                            addonsTotal += addonData.price;
                        } else {
                            console.error(`Addon ${addonId} no pertenece al producto ${item.productId}`);
                        }
                    } else {
                        console.error(`Addon ${addonId} no encontrado o inactivo`);
                    }
                }
            }

            const serverPrice = basePrice + addonsTotal;

            if (basePrice === 0) {
                console.error(`Producto ${item.productId} no encontrado o sin precio`);
            }

            return {
                ...item,
                unitPrice: serverPrice, // Precio calculado en servidor
            };
        });

        // Verificar que todos los productos existen
        const invalidItems = validatedItems.filter(item => item.unitPrice === 0);
        if (invalidItems.length > 0) {
            return NextResponse.json(
                { error: "Algunos productos no son válidos o no tienen precio" },
                { status: 400 }
            );
        }

        // Calcular total con precios validados del servidor
        const totalAmount = validatedItems.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
        );

        // 2) Crear (o usar) customer si viene customerData
        let finalCustomerId: number | null = customerId ?? null;

        if (!finalCustomerId && customerData) {
            const { name, phone, email, address, neighborhood, locality } = customerData;


            const { data: createdCustomer, error: customerError } = await supabase
                .from("customers")
                .insert({
                    name,
                    phone,
                    email: email ?? null,
                    address,
                    neighborhood: neighborhood ?? null,
                    locality: locality ?? null,
                })
                .select()
                .single();

            if (customerError) {
                console.error("Error creando customer:", customerError);
                // No bloquemos la compra, solo seguimos sin customer_id
                finalCustomerId = null;
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                finalCustomerId = (createdCustomer as any).id as number;
            }
        }

        // 3) Crear ORDER en Supabase con access_token para seguridad
        const accessToken = randomUUID();
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                customer_id: finalCustomerId,
                cart_id: null,
                status: "PENDING_PAYMENT",
                total_amount: totalAmount,
                currency,
                access_token: accessToken,
            })
            .select()
            .single();

        if (orderError || !order) {
            console.error("Error creando order:", orderError);
            return NextResponse.json(
                { error: "No se pudo crear la orden" },

            );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orderId = (order as any).id as number;

        // 4) Crear ORDER_ITEMS (con precios validados del servidor)
        const orderItemsToInsert = validatedItems.map((item) => ({
            order_id: orderId,
            product_id: item.productId,
            product_variant_id: item.productVariantId ?? null,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            line_total: item.unitPrice * item.quantity,
            personalization_front: item.personalizationFront ?? null,
            personalization_back: item.personalizationBack ?? null,
            engraving_font: item.engravingFont ?? null,
        }));

        const { data: createdItems, error: itemsError } = await supabase
            .from("order_items")
            .insert(orderItemsToInsert)
            .select();


        if (itemsError || !createdItems) {
            console.error("Error creando order_items:", itemsError);
            return NextResponse.json(
                { error: "No se pudo crear el detalle de la orden" }
            );
        }
// 4b) Guardar fotos personalizadas (si existen)
        for (let i = 0; i < validatedItems.length; i++) {
            const item = validatedItems[i];
            const orderItem = createdItems[i]; // el order_item recién creado

            if (!item.photos || item.photos.length === 0) continue;

            const photosToInsert = item.photos.map(photo => ({
                order_item_id: orderItem.id,
                storage_path: photo.storagePath,
                public_url: photo.publicUrl ?? null,
                position: photo.position,
            }));

            const { error: photosError } = await supabase
                .from("order_item_photos")
                .insert(photosToInsert);

            if (photosError) {
                console.error("Error guardando fotos del order_item:", photosError);
            }
        }


        // 5) Crear preferencia en Mercado Pago
        const baseUrl = process.env.BASE_URL;
        if (!baseUrl) {
            console.error("❌ BASE_URL no está configurada");
            return NextResponse.json(
                { error: "Error de configuración del servidor" },
                { status: 500 }
            );
        }
        const preference = new Preference(mpClient);

        const mpItems = validatedItems.map((item) => ({
            title: item.title,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            currency_id: currency,
        }));

        const mpResult = await preference.create({
            body: {
                items: mpItems,
                back_urls: {
                    success: `${baseUrl}/checkout/success?order_id=${orderId}&token=${accessToken}`,
                    failure: `${baseUrl}/checkout/failure?order_id=${orderId}&token=${accessToken}`,
                    pending: `${baseUrl}/checkout/pending?order_id=${orderId}&token=${accessToken}`,
                },
                auto_return: "approved",
                notification_url: `${baseUrl}/api/mercadopago/webhook`,
                external_reference: String(orderId),
            },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const initPoint = (mpResult as any).init_point;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const preferenceId = (mpResult as any).id || (mpResult as any).body?.id || null;

        // 6) Guardar mp_preference_id
        if (preferenceId) {
            const { error: updateError } = await supabase
                .from("orders")
                .update({ mp_preference_id: preferenceId })
                .eq("id", orderId);

            if (updateError) {
                console.error("Error actualizando mp_preference_id:", updateError);
            }
        }

        if (!initPoint) {
            console.error("mpResult sin init_point:", mpResult);
            return NextResponse.json(
                { error: "No se recibió la URL de pago de Mercado Pago" },

            );
        }

        // 8) Enviar email de confirmación si hay email del cliente
        if (customerData?.email) {
            try {
                await sendOrderConfirmationEmail({
                    to: customerData.email,
                    customerName: customerData.name,
                    orderId,
                    accessToken,
                    totalAmount,
                    items: validatedItems.map((item) => ({
                        title: item.title,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                    })),
                });
            } catch (emailError) {
                // No bloquear la compra si falla el email
                console.error("❌ Error enviando email (no bloqueante):", emailError);
            }
        }

        // 9) Respuesta al frontend (incluir token para consultas posteriores)
        return NextResponse.json(
            {
                init_point: initPoint,
                order_id: orderId,
                access_token: accessToken,
            },
        );
    } catch (error) {
        console.error("❌ Error general en /api/checkout:", error);
        return NextResponse.json(
            { error: "No se pudo crear la preferencia de pago" },

        );
    }
}
