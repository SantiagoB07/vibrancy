import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

export const runtime = "nodejs";

// Supabase server-side client (service role)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mercado Pago client
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || "",
});

// Webhook Secret de MercadoPago (configurar en el panel de MP)
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;

/**
 * Verifica la firma HMAC-SHA256 del webhook de MercadoPago
 * @see https://www.mercadopago.com.co/developers/es/docs/your-integrations/notifications/webhooks
 */
function verifyWebhookSignature(
    xSignature: string | null,
    xRequestId: string | null,
    dataId: string | null
): boolean {
    // Si no hay secret configurado, no podemos verificar
    if (!MP_WEBHOOK_SECRET) {
        console.warn("MP_WEBHOOK_SECRET no configurado - saltando verificación de firma");
        return true; // En desarrollo puedes dejarlo pasar, en producción debería fallar
    }

    if (!xSignature || !xRequestId) {
        console.error("Faltan headers x-signature o x-request-id");
        return false;
    }

    // Parsear x-signature: ts=xxx,v1=xxx
    const parts = xSignature.split(",");
    let ts: string | null = null;
    let hash: string | null = null;

    for (const part of parts) {
        const [key, value] = part.split("=");
        if (key === "ts") ts = value;
        if (key === "v1") hash = value;
    }

    if (!ts || !hash) {
        console.error("Formato de x-signature inválido");
        return false;
    }

    // Construir el manifest según documentación de MP
    // manifest = id:[data.id];request-id:[x-request-id];ts:[ts];
    const manifest = `id:${dataId || ""};request-id:${xRequestId};ts:${ts};`;

    // Calcular HMAC-SHA256
    const expectedHash = createHmac("sha256", MP_WEBHOOK_SECRET)
        .update(manifest)
        .digest("hex");

    // Comparación segura
    if (hash !== expectedHash) {
        console.error("Firma del webhook no válida");
        return false;
    }

    return true;
}

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

    console.log("Webhook GET recibido:", { type, id });

    return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
    try {
        // Obtener headers de firma
        const xSignature = req.headers.get("x-signature");
        const xRequestId = req.headers.get("x-request-id");

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
        const dataId = (idFromBody || idFromQuery)?.toString() || null;

        // Verificar firma HMAC
        if (!verifyWebhookSignature(xSignature, xRequestId, dataId)) {
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 401 }
            );
        }

        console.log("Webhook POST recibido:", {
            topic,
            idFromQuery,
            idFromBody,
        });

        // Solo procesamos notificaciones de tipo "payment"
        if (topic !== "payment") {
            console.log("Notificación ignorada (topic no es payment)");
            return NextResponse.json({ ignored: true });
        }

        const paymentId = dataId;
        if (!paymentId) {
            console.log("Notificación de payment sin id, se ignora");
            return NextResponse.json({ ignored: true });
        }

        // 1. Obtener el pago desde MP
        const paymentClient = new Payment(mpClient);
        const payment = await paymentClient.get({ id: paymentId });

        console.log("Detalle de pago obtenido:", payment);

        const externalReference = payment.external_reference;
        const mpStatus = payment.status;
        const transactionAmount = payment.transaction_amount;

        if (!externalReference) {
            console.error(
                "Pago sin external_reference, no se puede asociar a una orden"
            );
            return NextResponse.json(
                { error: "No external_reference" },
                { status: 400 }
            );
        }

        const orderId = parseInt(externalReference, 10);
        if (Number.isNaN(orderId)) {
            console.error(
                "external_reference no es un número de orden válido:",
                externalReference
            );
            return NextResponse.json(
                { error: "Invalid external_reference" },
                { status: 400 }
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
            console.error("Error consultando payments:", existingPaymentError);
        }

        const paymentPayload = {
            order_id: orderId,
            provider: "MERCADO_PAGO",
            provider_payment_id: paymentId,
            status: mpStatus ?? null,
            amount: transactionAmount != null ? Math.round(transactionAmount) : null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            raw_payload: payment as any,
        };

        if (existingPayment?.id) {
            const { data: updated, error: updatePaymentError } = await supabase
                .from("payments")
                .update(paymentPayload)
                .eq("id", existingPayment.id)
                .select();

            console.log("Resultado update payment:", {
                updated,
                updatePaymentError,
            });

            if (updatePaymentError) {
                console.error("Error actualizando payment:", updatePaymentError);
            } else {
                console.log("Payment actualizado en DB");
            }
        } else {
            const { data: inserted, error: insertPaymentError } = await supabase
                .from("payments")
                .insert(paymentPayload)
                .select();

            console.log("Resultado insert payment:", {
                inserted,
                insertPaymentError,
            });

            if (insertPaymentError) {
                console.error("Error insertando payment:", insertPaymentError);
            } else {
                console.log("Payment insertado en DB");
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
                console.error("Error actualizando orden:", updateOrderError);
            } else {
                console.log(
                    `Orden ${orderId} actualizada a estado ${newOrderStatus} por pago ${mpStatus}`
                );
            }
        } else {
            console.log(
                `Estado de pago ${mpStatus} no cambia el estado de la orden (se mantiene)`
            );
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error en webhook de Mercado Pago:", error);
        return NextResponse.json({ error: "Webhook error" }, { status: 500 });
    }
}
