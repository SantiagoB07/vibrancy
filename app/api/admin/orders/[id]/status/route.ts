// app/api/admin/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendOrderStatusUpdateEmail } from "@/lib/email";

export const runtime = "nodejs";

const ADMIN_EMAIL = "vibrancyaccesorios@gmail.com";

// Estados válidos
const VALID_STATUSES = [
    "PENDING_PAYMENT",
    "PENDING_TRANSFER",
    "PAID",
    "IN_PRODUCTION",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "PAYMENT_REJECTED",
];

// Transiciones válidas de estado
const VALID_TRANSITIONS: Record<string, string[]> = {
    PENDING_PAYMENT: ["PAID", "PENDING_TRANSFER", "CANCELLED"],
    PENDING_TRANSFER: ["PAID", "CANCELLED"],
    PAID: ["IN_PRODUCTION", "CANCELLED"],
    IN_PRODUCTION: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED", "CANCELLED"],
    DELIVERED: [],
    CANCELLED: [],
    PAYMENT_REJECTED: ["PENDING_PAYMENT"],
};

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verificar autenticación
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "No autenticado" },
                { status: 401 }
            );
        }

        // Verificar que sea admin
        if (user.email !== ADMIN_EMAIL) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 403 }
            );
        }

        const { id } = await params;
        const orderId = parseInt(id);

        if (isNaN(orderId)) {
            return NextResponse.json(
                { error: "ID de orden inválido" },
                { status: 400 }
            );
        }

        const body = await req.json();
        const { status: newStatus, trackingNumber } = body;

        if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
            return NextResponse.json(
                { error: "Estado inválido" },
                { status: 400 }
            );
        }

        // Crear cliente con service role para operaciones de escritura
        const supabaseService = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Obtener la orden actual
        const { data: order, error: orderError } = await supabaseService
            .from("orders")
            .select("*, customers (name, email)")
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            console.error("Error obteniendo orden:", orderError);
            return NextResponse.json(
                { error: "Orden no encontrada" },
                { status: 404 }
            );
        }

        // Validar transición de estado
        const validTransitions = VALID_TRANSITIONS[order.status] || [];
        if (!validTransitions.includes(newStatus)) {
            return NextResponse.json(
                { 
                    error: `No se puede cambiar de ${order.status} a ${newStatus}`,
                    validTransitions 
                },
                { status: 400 }
            );
        }

        // Preparar datos de actualización
        const updateData: Record<string, unknown> = {
            status: newStatus,
            updated_at: new Date().toISOString(),
        };

        // Si hay número de tracking, guardarlo
        if (trackingNumber && newStatus === "SHIPPED") {
            updateData.tracking_number = trackingNumber;
        }

        // Actualizar la orden
        const { error: updateError } = await supabaseService
            .from("orders")
            .update(updateData)
            .eq("id", orderId);

        if (updateError) {
            console.error("Error actualizando orden:", updateError);
            return NextResponse.json(
                { error: "Error al actualizar orden" },
                { status: 500 }
            );
        }

        // Enviar email de notificación si el cliente tiene email
        const customer = order.customers as { name: string; email: string | null } | null;
        if (customer?.email) {
            try {
                await sendOrderStatusUpdateEmail({
                    to: customer.email,
                    customerName: customer.name || "Cliente",
                    orderId: order.id,
                    accessToken: order.access_token,
                    newStatus,
                    trackingNumber: trackingNumber || null,
                });
            } catch (emailError) {
                console.error("Error enviando email de actualización:", emailError);
                // No fallar la operación si el email falla
            }
        }

        return NextResponse.json({
            success: true,
            order_id: orderId,
            previous_status: order.status,
            new_status: newStatus,
        });
    } catch (error) {
        console.error("Error en PATCH /api/admin/orders/[id]/status:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
