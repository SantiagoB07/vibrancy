// app/api/orders/[id]/update-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Estados válidos que el cliente puede establecer
const ALLOWED_CLIENT_STATUSES = ["PENDING_TRANSFER"];

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const orderId = Number(id);

        if (!orderId || Number.isNaN(orderId)) {
            return NextResponse.json(
                { error: "Invalid order id" },
                { status: 400 }
            );
        }

        const body = await req.json();
        const { token, status } = body;

        if (!token) {
            return NextResponse.json(
                { error: "Access token required" },
                { status: 401 }
            );
        }

        if (!status || !ALLOWED_CLIENT_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: "Invalid status" },
                { status: 400 }
            );
        }

        // Validar que el access_token coincida con la orden
        const { data: order, error: fetchError } = await supabase
            .from("orders")
            .select("id, access_token, status")
            .eq("id", orderId)
            .eq("access_token", token)
            .maybeSingle();

        if (fetchError) {
            console.error("Error consultando orden:", fetchError);
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

        // No permitir actualizar órdenes ya pagadas
        if (order.status === "PAID") {
            return NextResponse.json(
                { error: "Order already paid" },
                { status: 400 }
            );
        }

        // Actualizar el estado de la orden
        const { error: updateError } = await supabase
            .from("orders")
            .update({ 
                status,
                payment_method: "transfer",
                updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

        if (updateError) {
            console.error("Error actualizando orden:", updateError);
            return NextResponse.json(
                { error: "Failed to update order" },
                { status: 500 }
            );
        }

        return NextResponse.json({ 
            success: true, 
            order_id: orderId,
            status,
        });
    } catch (error) {
        console.error("Error en update-status:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
