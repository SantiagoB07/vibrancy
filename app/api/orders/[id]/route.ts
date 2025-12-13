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

    // No exponer el access_token en la respuesta
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { access_token: _, ...safeOrder } = order;

    return NextResponse.json({ order: safeOrder });
}

