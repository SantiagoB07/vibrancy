import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// URL pública del logo en Supabase Storage
const LOGO_URL = "https://gjkmnrzeezoccbyqqeho.supabase.co/storage/v1/object/public/vibrancy-logo/vibrancy-logo.png";

export interface OrderConfirmationEmailData {
    to: string;
    customerName: string;
    orderId: number;
    accessToken: string;
    totalAmount: number;
    items: {
        title: string;
        quantity: number;
        unitPrice: number;
    }[];
}

/**
 * Envía email de confirmación de pedido al cliente
 */
export async function sendOrderConfirmationEmail(data: OrderConfirmationEmailData) {
    const { to, customerName, orderId, accessToken, totalAmount, items } = data;

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const orderUrl = `${baseUrl}/mi-pedido/${orderId}?token=${accessToken}`;

    // Formatear items para el email
    const itemsHtml = items
        .map(
            (item) => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #E6C29A;">
                    ${item.title}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #E6C29A; text-align: center;">
                    ${item.quantity}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #E6C29A; text-align: right;">
                    $${item.unitPrice.toLocaleString("es-CO")}
                </td>
            </tr>
        `
        )
        .join("");

    const { data: result, error } = await resend.emails.send({
        from: "Vibrancy Accesorios <onboarding@resend.dev>",
        to: [to],
        subject: `¡Gracias por tu compra! - Orden #${orderId}`,
        html: `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmación de Pedido - Vibrancy</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #E6C29A;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background-color: #F9E3C8; border-radius: 20px 20px 0 0; padding: 30px; text-align: center;">
            <img src="${LOGO_URL}" alt="Vibrancy Accesorios" style="height: 80px; margin-bottom: 10px;" />
            <h1 style="color: #5E3A1E; margin: 0; font-size: 24px;">¡Gracias por tu compra, ${customerName}!</h1>
        </div>
        
        <!-- Content -->
        <div style="background-color: #FFFFFF; padding: 30px;">
            <p style="color: #6F4A2A; font-size: 16px; line-height: 1.6; margin-top: 0;">
                Hemos recibido tu pedido y estamos preparándolo con mucho cariño. 
                Te notificaremos cuando esté listo para envío.
            </p>
            
            <!-- Order Info Box -->
            <div style="background-color: #F9E3C8; border-radius: 12px; padding: 20px; margin: 25px 0;">
                <h2 style="color: #5E3A1E; margin: 0 0 15px 0; font-size: 18px;">
                    Orden #${orderId}
                </h2>
                
                <!-- Items Table -->
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #6F4A2A;">
                    <thead>
                        <tr style="background-color: #E6C29A;">
                            <th style="padding: 10px; text-align: left; border-radius: 6px 0 0 0;">Producto</th>
                            <th style="padding: 10px; text-align: center;">Cant.</th>
                            <th style="padding: 10px; text-align: right; border-radius: 0 6px 0 0;">Precio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                
                <!-- Total -->
                <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #B9804A;">
                    <p style="color: #5E3A1E; font-size: 20px; font-weight: bold; margin: 0; text-align: right;">
                        Total: $${totalAmount.toLocaleString("es-CO")} COP
                    </p>
                </div>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="${orderUrl}" 
                   style="background-color: #5E3A1E; color: #F9E3C8; padding: 16px 32px; 
                          text-decoration: none; border-radius: 30px; font-weight: bold; 
                          font-size: 16px; display: inline-block;">
                    Ver estado de mi pedido
                </a>
            </div>
            
            <p style="color: #7C5431; font-size: 14px; text-align: center; line-height: 1.6;">
                Guarda este correo para consultar el estado de tu pedido en cualquier momento.
                <br />
                ¿Tienes alguna pregunta? Escríbenos por WhatsApp o redes sociales.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #5E3A1E; border-radius: 0 0 20px 20px; padding: 20px; text-align: center;">
            <p style="color: #F9E3C8; font-size: 14px; margin: 0 0 10px 0;">
                Vibrancy Accesorios
            </p>
            <p style="color: #B9804A; font-size: 12px; margin: 0;">
                Bogotá, Colombia
            </p>
        </div>
    </div>
</body>
</html>
        `,
    });

    if (error) {
        console.error("❌ Error enviando email de confirmación:", error);
        return { success: false, error };
    }

    console.log("✅ Email de confirmación enviado:", result?.id);
    return { success: true, id: result?.id };
}

export interface OrderStatusUpdateEmailData {
    to: string;
    customerName: string;
    orderId: number;
    accessToken: string;
    newStatus: string;
    trackingNumber?: string | null;
}

/**
 * Mapea el estado de la orden a un texto amigable en español
 */
function getStatusText(status: string): { title: string; message: string; emoji: string } {
    const statusMap: Record<string, { title: string; message: string; emoji: string }> = {
        PAID: {
            title: "Pago confirmado",
            message: "Hemos recibido tu pago exitosamente. Tu pedido está siendo procesado.",
            emoji: "✅",
        },
        IN_PRODUCTION: {
            title: "En producción",
            message: "Tu pedido está siendo elaborado con mucho cariño. Pronto estará listo.",
            emoji: "🛠️",
        },
        SHIPPED: {
            title: "Pedido enviado",
            message: "Tu pedido está en camino. ¡Pronto lo tendrás en tus manos!",
            emoji: "📦",
        },
        DELIVERED: {
            title: "Entregado",
            message: "Tu pedido ha sido entregado. ¡Esperamos que lo disfrutes!",
            emoji: "🎉",
        },
        CANCELLED: {
            title: "Pedido cancelado",
            message: "Tu pedido ha sido cancelado. Si tienes dudas, contáctanos.",
            emoji: "❌",
        },
    };

    return statusMap[status] || {
        title: "Actualización de pedido",
        message: "El estado de tu pedido ha sido actualizado.",
        emoji: "📋",
    };
}

/**
 * Envía email de actualización de estado del pedido
 */
export async function sendOrderStatusUpdateEmail(data: OrderStatusUpdateEmailData) {
    const { to, customerName, orderId, accessToken, newStatus, trackingNumber } = data;

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const orderUrl = `${baseUrl}/mi-pedido/${orderId}?token=${accessToken}`;
    const statusInfo = getStatusText(newStatus);

    const trackingHtml = trackingNumber
        ? `
        <div style="background-color: #E8F5E9; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #2E7D32; font-size: 14px; margin: 0;">
                <strong>Número de guía:</strong> ${trackingNumber}
            </p>
        </div>
    `
        : "";

    const { data: result, error } = await resend.emails.send({
        from: "Vibrancy Accesorios <onboarding@resend.dev>",
        to: [to],
        subject: `${statusInfo.emoji} ${statusInfo.title} - Orden #${orderId}`,
        html: `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Actualización de Pedido - Vibrancy</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #E6C29A;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background-color: #F9E3C8; border-radius: 20px 20px 0 0; padding: 30px; text-align: center;">
            <img src="${LOGO_URL}" alt="Vibrancy Accesorios" style="height: 80px; margin-bottom: 10px;" />
            <h1 style="color: #5E3A1E; margin: 0; font-size: 24px;">
                ${statusInfo.emoji} ${statusInfo.title}
            </h1>
        </div>
        
        <!-- Content -->
        <div style="background-color: #FFFFFF; padding: 30px;">
            <p style="color: #6F4A2A; font-size: 16px; line-height: 1.6; margin-top: 0;">
                Hola ${customerName},
            </p>
            
            <p style="color: #6F4A2A; font-size: 16px; line-height: 1.6;">
                ${statusInfo.message}
            </p>
            
            <!-- Order Info Box -->
            <div style="background-color: #F9E3C8; border-radius: 12px; padding: 20px; margin: 25px 0;">
                <p style="color: #5E3A1E; font-size: 16px; margin: 0;">
                    <strong>Orden:</strong> #${orderId}
                </p>
                <p style="color: #5E3A1E; font-size: 16px; margin: 10px 0 0 0;">
                    <strong>Estado:</strong> ${statusInfo.title}
                </p>
            </div>
            
            ${trackingHtml}
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="${orderUrl}" 
                   style="background-color: #5E3A1E; color: #F9E3C8; padding: 16px 32px; 
                          text-decoration: none; border-radius: 30px; font-weight: bold; 
                          font-size: 16px; display: inline-block;">
                    Ver detalles del pedido
                </a>
            </div>
            
            <p style="color: #7C5431; font-size: 14px; text-align: center; line-height: 1.6;">
                ¿Tienes alguna pregunta? Escríbenos por WhatsApp o redes sociales.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #5E3A1E; border-radius: 0 0 20px 20px; padding: 20px; text-align: center;">
            <p style="color: #F9E3C8; font-size: 14px; margin: 0 0 10px 0;">
                Vibrancy Accesorios
            </p>
            <p style="color: #B9804A; font-size: 12px; margin: 0;">
                Bogotá, Colombia
            </p>
        </div>
    </div>
</body>
</html>
        `,
    });

    if (error) {
        console.error("❌ Error enviando email de actualización:", error);
        return { success: false, error };
    }

    console.log("✅ Email de actualización enviado:", result?.id);
    return { success: true, id: result?.id };
}
