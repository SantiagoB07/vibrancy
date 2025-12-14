"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { formatCOP } from "@/lib/utils";

interface Order {
    id: number;
    status: string;
    total_amount: number;
    currency?: string;
}

function PaymentMethodContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const orderId = searchParams.get("order_id");
    const token = searchParams.get("token");
    const initPoint = searchParams.get("init_point");

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!orderId || !token) {
            setError("Faltan datos de la orden");
            setLoading(false);
            return;
        }

        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/orders/${orderId}?token=${token}`);
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

        fetchOrder();
    }, [orderId, token]);

    const handleMercadoPago = () => {
        if (initPoint) {
            window.location.href = initPoint;
        }
    };

    const handleTransfer = () => {
        const params = new URLSearchParams({
            order_id: orderId || "",
            token: token || "",
        });
        router.push(`/checkout/transfer?${params}`);
    };

    // Loading state
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
                        Cargando...
                    </h1>
                    <p className="text-sm text-[#6F4A2A]">
                        Preparando las opciones de pago
                    </p>
                </div>
            </main>
        );
    }

    // Error state
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
                        Oops...
                    </h1>
                    <p className="text-sm text-[#6F4A2A] mb-6">
                        {error || "No pudimos cargar tu orden."}
                    </p>
                    <Link
                        href="/products"
                        className="inline-flex items-center justify-center w-full py-2.5 rounded-full bg-[#5E3A1E] text-[#F9E3C8] text-sm font-medium hover:bg-[#4C2F18] transition"
                    >
                        Volver a la tienda
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-[#E6C29A] px-4 py-8">
            <div className="max-w-md w-full bg-[#F9E3C8] rounded-3xl shadow-2xl border border-[#B9804A]/30 p-8">
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

                {/* Title */}
                <h1 className="text-2xl font-semibold text-[#5E3A1E] mb-2 text-center">
                    Selecciona tu método de pago
                </h1>

                {/* Order summary */}
                <div className="bg-[#E6C29A]/50 rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-[#6F4A2A]">Pedido</span>
                        <span className="font-semibold text-[#5E3A1E]">
                            #VIB-{String(order.id).padStart(5, "0")}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-2">
                        <span className="text-[#6F4A2A]">Total a pagar</span>
                        <span className="font-bold text-[#5E3A1E] text-lg">
                            {formatCOP(order.total_amount)}
                        </span>
                    </div>
                </div>

                {/* Payment options */}
                <div className="space-y-4">
                    {/* Mercado Pago option */}
                    {initPoint && (
                        <button
                            onClick={handleMercadoPago}
                            className="w-full bg-[#009EE3] hover:bg-[#008ACC] text-white rounded-2xl p-4 transition-all duration-200 hover:shadow-lg group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">💳</span>
                                </div>
                                <div className="text-left flex-1">
                                    <div className="font-semibold text-base">
                                        Mercado Pago
                                    </div>
                                    <div className="text-xs text-white/80">
                                        Paga con tu saldo o tarjeta guardada
                                    </div>
                                    <div className="text-xs text-white/60 mt-0.5">
                                        Requiere cuenta de Mercado Pago
                                    </div>
                                </div>
                                <div className="text-white/80 group-hover:translate-x-1 transition-transform">
                                    →
                                </div>
                            </div>
                        </button>
                    )}

                    {/* Transfer option */}
                    <button
                        onClick={handleTransfer}
                        className="w-full bg-[#5E3A1E] hover:bg-[#4C2F18] text-[#F9E3C8] rounded-2xl p-4 transition-all duration-200 hover:shadow-lg group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#F9E3C8] rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl">📱</span>
                            </div>
                            <div className="text-left flex-1">
                                <div className="font-semibold text-base">
                                    Nequi / Daviplata
                                </div>
                                <div className="text-xs text-[#F9E3C8]/80">
                                    Transfiere y envía tu comprobante
                                </div>
                                <div className="text-xs text-[#F9E3C8]/60 mt-0.5">
                                    Confirmación por WhatsApp
                                </div>
                            </div>
                            <div className="text-[#F9E3C8]/80 group-hover:translate-x-1 transition-transform">
                                →
                            </div>
                        </div>
                    </button>
                </div>

                {/* Security note */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-[#7C5431]">
                        🔒 Tu información está segura con nosotros
                    </p>
                </div>

                {/* Back link */}
                <div className="mt-4 text-center">
                    <Link
                        href="/products"
                        className="text-sm text-[#6F4A2A] hover:text-[#5E3A1E] underline transition"
                    >
                        Cancelar y volver a la tienda
                    </Link>
                </div>
            </div>
        </main>
    );
}

function LoadingFallback() {
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
                    Cargando...
                </h1>
            </div>
        </main>
    );
}

export default function PaymentMethodPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <PaymentMethodContent />
        </Suspense>
    );
}
