import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Supabase server-side client (service role)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mercado Pago client
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || "",
});

// Mapear estado de MP a estado de orden
function mapPaymentStatusToOrderStatus(mpStatus: string | null | undefined) {
    switch (mpStatus) {
        case "approved":
            return "PAID";
        case "rejected":
            return "PAYMENT_REJECTED";
        case "refunded":
        case "charged_back":
            return "REFUNDED";
        case "in_process":
        case "pending":
        default:
            return null;
    }
}

// GET para pruebas/ping
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type") || searchParams.get("topic");
    const id = searchParams.get("id") || searchParams.get("data.id");

    console.log("🔎 Webhook GET recibido:", { type, id });

    return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => null);
        const searchParams = req.nextUrl.searchParams;

        const topic =
            body?.topic ||
            body?.type ||
            searchParams.get("topic") ||
            searchParams.get("type");

        const idFromQuery =
            searchParams.get("data.id") || searchParams.get("id");
        const idFromBody = body?.data?.id || body?.id;

        console.log("📩 Webhook POST recibido:", {
            topic,
            idFromQuery,
            idFromBody,
            body,
        });

        // ✅ Solo procesamos notificaciones de tipo "payment"
        if (topic !== "payment") {
            console.log("ℹ️ Notificación ignorada (topic no es payment)");
            return NextResponse.json({ ignored: true }, );
        }

        const paymentId = (idFromBody || idFromQuery)?.toString();
        if (!paymentId) {
            console.log("ℹ️ Notificación de payment sin id, se ignora");
            return NextResponse.json({ ignored: true }, );
        }

        // 1. Obtener el pago desde MP
        const paymentClient = new Payment(mpClient);
        const payment = await paymentClient.get({ id: paymentId });

        console.log("✅ Detalle de pago obtenido:", payment);

        const externalReference = payment.external_reference;
        const mpStatus = payment.status;
        const transactionAmount = payment.transaction_amount;

        if (!externalReference) {
            console.error(
                "❌ Pago sin external_reference, no se puede asociar a una orden"
            );
            return NextResponse.json(
                { error: "No external_reference" },

            );
        }

        const orderId = parseInt(externalReference, 10);
        if (Number.isNaN(orderId)) {
            console.error(
                "❌ external_reference no es un número de orden válido:",
                externalReference
            );
            return NextResponse.json(
                { error: "Invalid external_reference" },

            );
        }

        // 2. Upsert en payments usando tu schema:
        // provider, provider_payment_id, status, amount, raw_payload, order_id
        const { data: existingPayment, error: existingPaymentError } = await supabase
            .from("payments")
            .select("id, status, provider_payment_id")
            .eq("provider", "MERCADO_PAGO")
            .eq("provider_payment_id", paymentId)
            .maybeSingle();

        if (existingPaymentError) {
            console.error("❌ Error consultando payments:", existingPaymentError);
        }

        const paymentPayload = {
            order_id: orderId,
            provider: "MERCADO_PAGO",
            provider_payment_id: paymentId,
            status: mpStatus ?? null,
            amount: transactionAmount != null ? Math.round(transactionAmount) : null,
            raw_payload: payment as any,
        };

        if (existingPayment?.id) {
            const { data: updated, error: updatePaymentError } = await supabase
                .from("payments")
                .update(paymentPayload)
                .eq("id", existingPayment.id)
                .select();

            console.log("🔁 Resultado update payment:", {
                updated,
                updatePaymentError,
            });

            if (updatePaymentError) {
                console.error("❌ Error actualizando payment:", updatePaymentError);
            } else {
                console.log("🔁 Payment actualizado en DB");
            }
        } else {
            const { data: inserted, error: insertPaymentError } = await supabase
                .from("payments")
                .insert(paymentPayload)
                .select();

            console.log("💾 Resultado insert payment:", {
                inserted,
                insertPaymentError,
            });

            if (insertPaymentError) {
                console.error("❌ Error insertando payment:", insertPaymentError);
            } else {
                console.log("💾 Payment insertado en DB");
            }
        }

        // 3. Actualizar orden
        const newOrderStatus = mapPaymentStatusToOrderStatus(mpStatus);

        if (newOrderStatus) {
            const { error: updateOrderError } = await supabase
                .from("orders")
                .update({
                    status: newOrderStatus,
                    // si tienes columnas mp_payment_status en orders puedes setearlas aquí
                })
                .eq("id", orderId);

            if (updateOrderError) {
                console.error("❌ Error actualizando orden:", updateOrderError);
            } else {
                console.log(
                    `🚀 Orden ${orderId} actualizada a estado ${newOrderStatus} por pago ${mpStatus}`
                );
            }
        } else {
            console.log(
                `ℹ️ Estado de pago ${mpStatus} no cambia el estado de la orden (se mantiene)`
            );
        }

        return NextResponse.json({ ok: true }, );
    } catch (error) {
        console.error("❌ Error en webhook de Mercado Pago:", error);
        return NextResponse.json({ error: "Webhook error" }, );
    }
}
