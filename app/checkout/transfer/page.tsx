"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatCOP } from "@/lib/utils";
import { PAYMENT_CONFIG, BRAND } from "@/lib/constants";

interface Order {
    id: number;
    status: string;
    total_amount: number;
    currency?: string;
}

function TransferContent() {
    const searchParams = useSearchParams();

    const orderId = searchParams.get("order_id");
    const token = searchParams.get("token");

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

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

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleSendWhatsApp = async () => {
        if (!order || !orderId || !token) return;

        setUpdatingStatus(true);

        // Actualizar estado de la orden a PENDING_TRANSFER
        try {
            await fetch(`/api/orders/${orderId}/update-status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    status: "PENDING_TRANSFER",
                }),
            });
        } catch (err) {
            console.error("Error actualizando estado:", err);
        }

        // Construir mensaje de WhatsApp
        const orderRef = `VIB-${String(order.id).padStart(5, "0")}`;
        const total = formatCOP(order.total_amount);

        const message = encodeURIComponent(
            `Hola! Acabo de realizar una transferencia para mi pedido en ${BRAND.NAME}\n\n` +
            `Pedido: #${orderRef}\n` +
            `Total: ${total}\n\n` +
            `Adjunto mi comprobante de pago.`
        );

        const whatsappUrl = `https://wa.me/${PAYMENT_CONFIG.WHATSAPP}?text=${message}`;

        setUpdatingStatus(false);
        window.open(whatsappUrl, "_blank");
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

    const orderRef = `VIB-${String(order.id).padStart(5, "0")}`;

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
                    Transferencia Nequi / Daviplata
                </h1>

                <p className="text-sm text-[#6F4A2A] text-center mb-6">
                    Realiza tu transferencia y envíanos el comprobante por WhatsApp
                </p>

                {/* Order summary */}
                <div className="bg-[#5E3A1E] text-[#F9E3C8] rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-center text-sm mb-2">
                        <span className="opacity-80">Pedido</span>
                        <span className="font-semibold">#{orderRef}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="opacity-80">Total a transferir</span>
                        <span className="font-bold text-xl">
                            {formatCOP(order.total_amount)}
                        </span>
                    </div>
                </div>

                {/* Payment accounts */}
                <div className="space-y-3 mb-6">
                    {/* Nequi */}
                    <div className="bg-[#E6C29A]/50 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#E91E63] rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">N</span>
                                </div>
                                <div>
                                    <div className="text-xs text-[#6F4A2A]">Nequi</div>
                                    <div className="font-semibold text-[#5E3A1E]">
                                        {PAYMENT_CONFIG.NEQUI}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => copyToClipboard(PAYMENT_CONFIG.NEQUI, "nequi")}
                                className="px-3 py-1.5 bg-[#5E3A1E] text-[#F9E3C8] text-xs rounded-lg hover:bg-[#4C2F18] transition"
                            >
                                {copied === "nequi" ? "Copiado!" : "Copiar"}
                            </button>
                        </div>
                    </div>

                    {/* Daviplata */}
                    <div className="bg-[#E6C29A]/50 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#E30613] rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">D</span>
                                </div>
                                <div>
                                    <div className="text-xs text-[#6F4A2A]">Daviplata</div>
                                    <div className="font-semibold text-[#5E3A1E]">
                                        {PAYMENT_CONFIG.DAVIPLATA}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => copyToClipboard(PAYMENT_CONFIG.DAVIPLATA, "daviplata")}
                                className="px-3 py-1.5 bg-[#5E3A1E] text-[#F9E3C8] text-xs rounded-lg hover:bg-[#4C2F18] transition"
                            >
                                {copied === "daviplata" ? "Copiado!" : "Copiar"}
                            </button>
                        </div>
                    </div>

                    {/* Titular */}
                    <div className="text-center text-sm text-[#6F4A2A]">
                        A nombre de: <span className="font-semibold text-[#5E3A1E]">{PAYMENT_CONFIG.TITULAR}</span>
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <div className="flex gap-3">
                        <span className="text-xl">⚠️</span>
                        <div className="text-sm text-amber-800">
                            <p className="font-semibold mb-1">Importante:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                <li>Usa como referencia: <span className="font-semibold">{orderRef}</span></li>
                                <li>Una vez transferido, envíanos el comprobante</li>
                                <li>Confirmaremos tu pedido por WhatsApp</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* WhatsApp button */}
                <button
                    onClick={handleSendWhatsApp}
                    disabled={updatingStatus}
                    className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-2xl p-4 transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="flex items-center justify-center gap-3">
                        <svg
                            className="w-6 h-6"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        <span className="font-semibold">
                            {updatingStatus ? "Procesando..." : "Ya pagué, enviar comprobante"}
                        </span>
                    </div>
                </button>

                {/* Link de seguimiento */}
                <div className="bg-[#E6C29A]/50 rounded-xl p-4 mt-6">
                    <p className="text-xs font-semibold text-[#5E3A1E] mb-2">
                        Guarda este link para ver el estado de tu pedido:
                    </p>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            readOnly
                            value={`${typeof window !== "undefined" ? window.location.origin : ""}/mi-pedido/${orderId}?token=${token}`}
                            className="flex-1 text-xs bg-white border border-[#B9804A]/30 rounded-lg px-3 py-2 text-[#6F4A2A] truncate"
                        />
                        <button
                            onClick={() => copyToClipboard(`${window.location.origin}/mi-pedido/${orderId}?token=${token}`, "tracking")}
                            className="px-3 py-2 bg-[#5E3A1E] text-[#F9E3C8] text-xs rounded-lg hover:bg-[#4C2F18] transition whitespace-nowrap"
                        >
                            {copied === "tracking" ? "¡Copiado!" : "Copiar"}
                        </button>
                    </div>
                    <p className="text-xs text-[#7C5431] mt-2">
                        Con este link puedes consultar el estado de tu pedido en cualquier momento.
                    </p>
                </div>

                {/* Back link */}
                <div className="mt-6 text-center">
                    <Link
                        href={`/checkout/payment-method?order_id=${orderId}&token=${token}`}
                        className="text-sm text-[#6F4A2A] hover:text-[#5E3A1E] underline transition"
                    >
                        ← Elegir otro método de pago
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

export default function TransferPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <TransferContent />
        </Suspense>
    );
}
