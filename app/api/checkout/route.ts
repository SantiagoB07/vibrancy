// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

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
    unitPrice: number;
    title: string;
    personalizationFront?: string | null;
    personalizationBack?: string | null;

    photos?: {
        storagePath: string;     // ruta dentro del bucket
        publicUrl?: string | null;
        position: number;        // 1,2,3
    }[];
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

            );
        }



        const currency = "COP";

        // 1) Calcular total
        const totalAmount = items.reduce(
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
                finalCustomerId = (createdCustomer as any).id as number;
            }
        }

        // 3) Crear ORDER en Supabase
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                customer_id: finalCustomerId,
                cart_id: null,
                status: "PENDING_PAYMENT",
                total_amount: totalAmount,
                currency,
            })
            .select()
            .single();

        if (orderError || !order) {
            console.error("Error creando order:", orderError);
            return NextResponse.json(
                { error: "No se pudo crear la orden" },

            );
        }

        const orderId = (order as any).id as number;

        // 4) Crear ORDER_ITEMS
        const orderItemsToInsert = items.map((item) => ({
            order_id: orderId,
            product_id: item.productId,
            product_variant_id: item.productVariantId ?? null,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            line_total: item.unitPrice * item.quantity,
            personalization_front: item.personalizationFront ?? null,
            personalization_back: item.personalizationBack ?? null,
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
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
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
        const baseUrl = process.env.BASE_URL || "http://localhost:3000";
        const preference = new Preference(mpClient);

        const mpItems = items.map((item) => ({
            title: item.title,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            currency_id: currency,
        }));

        const mpResult = await preference.create({
            body: {
                items: mpItems,
                back_urls: {
                    success: `${baseUrl}/checkout/success?order_id=${orderId}`,
                    failure: `${baseUrl}/checkout/failure?order_id=${orderId}`,
                    pending: `${baseUrl}/checkout/pending?order_id=${orderId}`,
                },
                auto_return: "approved",
                notification_url: `${baseUrl}/api/mercadopago/webhook`,
                external_reference: String(orderId),
            },
        } as any);

        const initPoint = (mpResult as any).init_point;
        const preferenceId =
            (mpResult as any).id || (mpResult as any).body?.id || null;

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

        // 7) Respuesta al frontend
        return NextResponse.json(
            {
                init_point: initPoint,
                order_id: orderId,
            },

        );
    } catch (error) {
        console.error("❌ Error general en /api/checkout:", error);
        return NextResponse.json(
            { error: "No se pudo crear la preferencia de pago" },

        );
    }
}
