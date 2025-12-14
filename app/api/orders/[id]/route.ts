// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const orderId = Number(id);

    // Obtener access_token del query string
    const { searchParams } = new URL(req.url);
    const accessToken = searchParams.get("token");

    if (!orderId || Number.isNaN(orderId)) {
        return NextResponse.json(
            { error: "Invalid order id" },
            { status: 400 }
        );
    }

    if (!accessToken) {
        return NextResponse.json(
            { error: "Access token required" },
            { status: 401 }
        );
    }

    // Validar que el access_token coincida con la orden
    const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("access_token", accessToken)
        .maybeSingle();

    if (error) {
        console.error("Error consultando orden:", error);
        return NextResponse.json(
            { error: "DB error" },
            { status: 500 }
        );
    }

    if (!order) {
        return NextResponse.json(
            { error: "Order not found or invalid token" },
            { status: 404 }
        );
    }

    // Obtener items de la orden con información del producto
    const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select(`
            id,
            product_id,
            product_variant_id,
            quantity,
            unit_price,
            line_total,
            personalization_front,
            personalization_back,
            engraving_font,
            products (
                id,
                title,
                description
            )
        `)
        .eq("order_id", orderId);

    if (itemsError) {
        console.error("Error consultando items:", itemsError);
    }

    // Obtener fotos de los items
    const itemIds = items?.map((item) => item.id) || [];
    let photos: { order_item_id: number; storage_path: string; public_url: string | null; position: number }[] = [];

    if (itemIds.length > 0) {
        const { data: photosData, error: photosError } = await supabase
            .from("order_item_photos")
            .select("order_item_id, storage_path, public_url, position")
            .in("order_item_id", itemIds);

        if (photosError) {
            console.error("Error consultando fotos:", photosError);
        } else {
            photos = photosData || [];
        }
    }

    // Obtener datos del cliente si existe
    let customer = null;
    if (order.customer_id) {
        const { data: customerData, error: customerError } = await supabase
            .from("customers")
            .select("id, name, phone, email, address, neighborhood, locality")
            .eq("id", order.customer_id)
            .maybeSingle();

        if (customerError) {
            console.error("Error consultando cliente:", customerError);
        } else {
            customer = customerData;
        }
    }

    // Agregar fotos a cada item
    const itemsWithPhotos = items?.map((item) => ({
        ...item,
        photos: photos.filter((p) => p.order_item_id === item.id),
    })) || [];

    // No exponer el access_token en la respuesta
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { access_token: _, ...safeOrder } = order;

    return NextResponse.json({
        order: safeOrder,
        items: itemsWithPhotos,
        customer,
    });
}
