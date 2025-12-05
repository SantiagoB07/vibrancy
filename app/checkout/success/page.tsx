"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Order {
    id: number;
    status: string;
    total_amount?: number;
    currency?: string;
    created_at?: string;
}

export default function CheckoutSuccessPage() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("order_id");

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState<boolean>(!!orderId);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!orderId) return;

        let attempts = 0;
        let interval: NodeJS.Timeout;

        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/orders/${orderId}`);
                if (!res.ok) {
                    setError("No pudimos obtener la información de tu orden.");
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                setOrder(data.order);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError("Ocurrió un error al consultar tu orden.");
                setLoading(false);
            }
        };

        // Primer intento inmediato
        fetchOrder();

        // Polling corto por si el webhook se demora (máx. ~18s)
        interval = setInterval(() => {
            attempts += 1;
            if (attempts > 5) {
                clearInterval(interval);
                return;
            }
            fetchOrder();
        }, 3000);

        return () => clearInterval(interval);
    }, [orderId]);

    const isPaid = order?.status === "PAID";

    // Distintos estados de la vista según lo que tengamos

    // 1. No llegó order_id en la URL
    if (!orderId) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-[#E6C29A] px-4">
                <div className="max-w-md w-full bg-[#F9E3C8] rounded-3xl shadow-2xl border border-[#B9804A]/30 p-8 text-center">
                    {/* Logo */}
                    <div className="flex justify-center mb-4">
                        <div className="relative w-20 h-20">
                            <Image
                                src="/images/vibrancy-logo.png"
                                alt="Vibrancy Accesorios"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>

                    <h1 className="text-2xl font-semibold text-[#5E3A1E] mb-2">
                        ¡Pago recibido! ✨
                    </h1>

                    <p className="text-sm text-[#6F4A2A] mb-6">
                        Gracias por confiar en{" "}
                        <span className="font-semibold">Vibrancy Accesorios</span>.
                        Tu compra está siendo procesada y pronto nos pondremos en contacto
                        contigo con los detalles del pedido.
                    </p>

                    <div className="mb-6 text-xs text-[#7C5431]">
                        No pudimos identificar el número de tu orden, pero si tienes
                        alguna duda puedes escribirnos a nuestro WhatsApp o redes sociales
                        y te ayudamos con todo el proceso.
                    </div>

                    <Link
                        href={"/products"}
                        className="inline-flex items-center justify-center w-full py-2.5 rounded-full bg-[#5E3A1E] text-[#F9E3C8] text-sm font-medium hover:bg-[#4C2F18] transition"
                    >
                        Volver a la tienda
                    </Link>
                </div>
            </main>
        );
    }

    // 2. Cargando / confirmando con el backend
    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-[#E6C29A] px-4">
                <div className="max-w-md w-full bg-[#F9E3C8] rounded-3xl shadow-2xl border border-[#B9804A]/30 p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="relative w-20 h-20">
                            <Image
                                src="/images/vibrancy-logo.png"
                                alt="Vibrancy Accesorios"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>

                    <h1 className="text-2xl font-semibold text-[#5E3A1E] mb-2">
                        Confirmando tu pago… ✨
                    </h1>

                    <p className="text-sm text-[#6F4A2A] mb-6">
                        Estamos verificando la confirmación con Mercado Pago.
                        Esto puede tomar unos segundos.
                    </p>

                    <div className="mb-6 text-xs text-[#7C5431]">
                        No cierres esta página, se actualizará automáticamente cuando
                        tengamos la confirmación.
                    </div>
                </div>
            </main>
        );
    }

    // 3. Hubo error o no se encontró la orden
    if (error || !order) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-[#E6C29A] px-4">
                <div className="max-w-md w-full bg-[#F9E3C8] rounded-3xl shadow-2xl border border-[#B9804A]/30 p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="relative w-20 h-20">
                            <Image
                                src="/images/vibrancy-logo.png"
                                alt="Vibrancy Accesorios"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>

                    <h1 className="text-2xl font-semibold text-[#5E3A1E] mb-2">
                        ¡Gracias por tu compra! ✨
                    </h1>

                    <p className="text-sm text-[#6F4A2A] mb-4">
                        {error ??
                            "No pudimos cargar el estado de tu orden en este momento."}
                    </p>

                    <p className="text-xs text-[#7C5431] mb-6">
                        Si tienes dudas, escríbenos mencionando este número de orden:{" "}
                        <span className="font-semibold">#{orderId}</span>.
                    </p>

                    <Link
                        href={"/products/page.tsx"}
                        className="inline-flex items-center justify-center w-full py-2.5 rounded-full bg-[#5E3A1E] text-[#F9E3C8] text-sm font-medium hover:bg-[#4C2F18] transition"
                    >
                        Volver a la tienda
                    </Link>
                </div>
            </main>
        );
    }

    // 4. Orden encontrada: cambiamos mensaje según estado real
    return (
        <main className="min-h-screen flex items-center justify-center bg-[#E6C29A] px-4">
            <div className="max-w-md w-full bg-[#F9E3C8] rounded-3xl shadow-2xl border border-[#B9804A]/30 p-8 text-center">
                {/* Logo */}
                <div className="flex justify-center mb-4">
                    <div className="relative w-20 h-20">
                        <Image
                            src="/images/vibrancy-logo.png"
                            alt="Vibrancy Accesorios"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>

                <h1 className="text-2xl font-semibold text-[#5E3A1E] mb-2">
                    {isPaid ? "¡Pago recibido! ✨" : "Estamos procesando tu pago ⏳"}
                </h1>

                <p className="text-sm text-[#6F4A2A] mb-4">
                    Gracias por confiar en{" "}
                    <span className="font-semibold">Vibrancy Accesorios</span>.
                </p>

                <div className="text-xs text-[#7C5431] mb-4 space-y-1">
                    <p>
                        Número de orden: <span className="font-semibold">#{order.id}</span>
                    </p>
                    <p>
                        Estado actual:{" "}
                        <span className="font-semibold">{order.status}</span>
                    </p>
                    {order.total_amount != null && (
                        <p>
                            Total:{" "}
                            <span className="font-semibold">
                {order.total_amount} {order.currency ?? "COP"}
              </span>
                        </p>
                    )}
                </div>

                {isPaid ? (
                    <p className="mb-6 text-xs text-[#7C5431]">
                        Tu compra está confirmada y pronto nos pondremos en contacto contigo
                        con los detalles del pedido y el envío. 💖
                    </p>
                ) : (
                    <p className="mb-6 text-xs text-[#7C5431]">
                        Ya registramos tu orden, pero la confirmación del pago aún está en
                        proceso. Si ya pagaste, esta página se actualizará cuando Mercado
                        Pago confirme la transacción.
                    </p>
                )}

                <Link
                    href="#productos"
                    className="inline-flex items-center justify-center w-full py-2.5 rounded-full bg-[#5E3A1E] text-[#F9E3C8] text-sm font-medium hover:bg-[#4C2F18] transition"
                >
                    Volver a la tienda
                </Link>
            </div>
        </main>
    );
}
