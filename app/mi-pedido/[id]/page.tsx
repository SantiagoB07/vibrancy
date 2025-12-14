"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { Package, Truck, CheckCircle, Clock, CreditCard, XCircle, Hammer } from "lucide-react";

// Tipos
interface OrderItem {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    line_total: number;
    personalization_front?: string | null;
    personalization_back?: string | null;
    engraving_font?: string | null;
    products?: {
        id: number;
        title: string;
        description?: string | null;
    } | null;
    photos?: {
        order_item_id: number;
        storage_path: string;
        public_url: string | null;
        position: number;
    }[];
}

interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string;
    address: string;
    neighborhood?: string | null;
    locality: string;
}

interface Order {
    id: number;
    status: string;
    total_amount: number;
    currency: string;
    created_at: string;
    tracking_number?: string | null;
}

// Configuración de estados
const ORDER_STATUSES = {
    PENDING_PAYMENT: {
        label: "Pendiente de pago",
        icon: CreditCard,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        step: -1,
        hideTimeline: false,
    },
    PENDING_TRANSFER: {
        label: "Esperando transferencia",
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        step: -1,
        hideTimeline: false,
    },
    PAID: {
        label: "Pagado",
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-100",
        step: 0,
        hideTimeline: false,
    },
    IN_PRODUCTION: {
        label: "En produccion",
        icon: Hammer,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        step: 1,
        hideTimeline: false,
    },
    SHIPPED: {
        label: "Enviado",
        icon: Truck,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
        step: 2,
        hideTimeline: false,
    },
    DELIVERED: {
        label: "Entregado",
        icon: Package,
        color: "text-green-700",
        bgColor: "bg-green-200",
        step: 3,
        hideTimeline: false,
    },
    CANCELLED: {
        label: "Cancelado",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-100",
        step: -1,
        hideTimeline: true,
    },
    PAYMENT_REJECTED: {
        label: "Pago rechazado",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-100",
        step: -1,
        hideTimeline: true,
    },
};

type OrderStatusKey = keyof typeof ORDER_STATUSES;

// Timeline steps
const TIMELINE_STEPS = [
    { label: "Pago confirmado", icon: CreditCard },
    { label: "En produccion", icon: Hammer },
    { label: "Enviado", icon: Truck },
    { label: "Entregado", icon: Package },
];

function OrderTimeline({ currentStep }: { currentStep: number }) {
    // No mostrar timeline para estados cancelados/rechazados (step === -1 y es error)
    // Pero sí mostrar para pendientes de pago (step === -1 pero es pendiente)
    
    return (
        <div className="py-6">
            <div className="flex items-center justify-between relative">
                {/* Linea de fondo */}
                <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 -translate-y-1/2 z-0" />
                {/* Linea de progreso */}
                <div
                    className="absolute left-0 top-1/2 h-1 bg-[#5E3A1E] -translate-y-1/2 z-0 transition-all duration-500"
                    style={{ width: currentStep >= 0 ? `${(currentStep / (TIMELINE_STEPS.length - 1)) * 100}%` : "0%" }}
                />

                {TIMELINE_STEPS.map((step, index) => {
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;
                    const Icon = step.icon;

                    return (
                        <div key={step.label} className="flex flex-col items-center z-10">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                    isCompleted
                                        ? "bg-[#5E3A1E] text-white"
                                        : "bg-gray-200 text-gray-400"
                                } ${isCurrent ? "ring-4 ring-[#B9804A]/30" : ""}`}
                            >
                                <Icon className="w-5 h-5" />
                            </div>
                            <span
                                className={`mt-2 text-xs font-medium text-center max-w-[80px] ${
                                    isCompleted ? "text-[#5E3A1E]" : "text-gray-400"
                                }`}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function formatCOP(amount: number): string {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function MiPedidoContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const orderId = params.id as string;
    const token = searchParams.get("token");

    const [order, setOrder] = useState<Order | null>(null);
    const [items, setItems] = useState<OrderItem[]>([]);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!orderId || !token) {
            setError("Enlace invalido. Verifica que el enlace sea correcto.");
            setLoading(false);
            return;
        }

        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/orders/${orderId}?token=${token}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setError("Pedido no encontrado o enlace invalido.");
                    } else {
                        setError("Error al cargar el pedido. Intenta de nuevo.");
                    }
                    setLoading(false);
                    return;
                }

                const data = await res.json();
                setOrder(data.order);
                setItems(data.items || []);
                setCustomer(data.customer);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching order:", err);
                setError("Error de conexion. Intenta de nuevo.");
                setLoading(false);
            }
        };

        fetchOrder();

        // Polling cada 30 segundos para actualizar el estado
        const interval = setInterval(fetchOrder, 30000);
        return () => clearInterval(interval);
    }, [orderId, token]);

    // Loading state
    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-[#E6C29A] px-4">
                <div className="max-w-lg w-full bg-[#F9E3C8] rounded-3xl shadow-2xl border border-[#B9804A]/30 p-8 text-center">
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
                    <div className="animate-pulse">
                        <div className="h-6 bg-[#E6C29A] rounded w-3/4 mx-auto mb-4" />
                        <div className="h-4 bg-[#E6C29A] rounded w-1/2 mx-auto" />
                    </div>
                    <p className="text-sm text-[#6F4A2A] mt-4">Cargando tu pedido...</p>
                </div>
            </main>
        );
    }

    // Error state
    if (error || !order) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-[#E6C29A] px-4">
                <div className="max-w-lg w-full bg-[#F9E3C8] rounded-3xl shadow-2xl border border-[#B9804A]/30 p-8 text-center">
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
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-semibold text-[#5E3A1E] mb-2">
                        No pudimos encontrar tu pedido
                    </h1>
                    <p className="text-sm text-[#6F4A2A] mb-6">
                        {error || "El enlace puede ser invalido o haber expirado."}
                    </p>
                    <Link
                        href="/products"
                        className="inline-flex items-center justify-center w-full py-2.5 rounded-full bg-[#5E3A1E] text-[#F9E3C8] text-sm font-medium hover:bg-[#4C2F18] transition"
                    >
                        Ir a la tienda
                    </Link>
                </div>
            </main>
        );
    }

    const statusConfig = ORDER_STATUSES[order.status as OrderStatusKey] || ORDER_STATUSES.PENDING_PAYMENT;
    const StatusIcon = statusConfig.icon;

    return (
        <main className="min-h-screen bg-[#E6C29A] px-4 py-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-[#F9E3C8] rounded-t-3xl shadow-lg border border-[#B9804A]/30 p-6 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="relative w-16 h-16">
                            <Image
                                src="/images/vibrancy-logo.png"
                                alt="Vibrancy Accesorios"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-[#5E3A1E]">
                        Pedido #{order.id}
                    </h1>
                    <p className="text-sm text-[#7C5431] mt-1">
                        {formatDate(order.created_at)}
                    </p>
                </div>

                {/* Status Badge */}
                <div className="bg-white border-x border-[#B9804A]/30 p-6">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bgColor}`}>
                        <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                        <span className={`font-semibold ${statusConfig.color}`}>
                            {statusConfig.label}
                        </span>
                    </div>

                    {/* Timeline */}
                    {!statusConfig.hideTimeline && (
                        <OrderTimeline currentStep={statusConfig.step} />
                    )}

                    {/* Tracking Number */}
                    {order.tracking_number && (
                        <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                            <p className="text-sm text-purple-800">
                                <strong>Numero de guia:</strong> {order.tracking_number}
                            </p>
                        </div>
                    )}
                </div>

                {/* Products */}
                <div className="bg-white border-x border-[#B9804A]/30 px-6 pb-6">
                    <h2 className="text-lg font-semibold text-[#5E3A1E] mb-4">
                        Productos
                    </h2>
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="flex gap-4 p-4 bg-[#F9E3C8]/50 rounded-xl"
                            >
                                <div className="flex-1">
                                    <h3 className="font-medium text-[#5E3A1E]">
                                        {item.products?.title || `Producto #${item.product_id}`}
                                    </h3>
                                    <p className="text-sm text-[#7C5431]">
                                        Cantidad: {item.quantity} x {formatCOP(item.unit_price)}
                                    </p>

                                    {/* Personalizaciones */}
                                    {(item.personalization_front || item.personalization_back) && (
                                        <div className="mt-2 text-xs text-[#6F4A2A] space-y-1">
                                            {item.personalization_front && (
                                                <p>
                                                    <span className="font-medium">Anverso:</span>{" "}
                                                    {item.personalization_front}
                                                </p>
                                            )}
                                            {item.personalization_back && (
                                                <p>
                                                    <span className="font-medium">Reverso:</span>{" "}
                                                    {item.personalization_back}
                                                </p>
                                            )}
                                            {item.engraving_font && (
                                                <p>
                                                    <span className="font-medium">Fuente:</span>{" "}
                                                    {item.engraving_font}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-[#5E3A1E]">
                                        {formatCOP(item.line_total)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total */}
                    <div className="mt-6 pt-4 border-t border-[#B9804A]/30">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-[#5E3A1E]">Total</span>
                            <span className="text-xl font-bold text-[#5E3A1E]">
                                {formatCOP(order.total_amount)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Shipping Info */}
                {customer && (
                    <div className="bg-white border-x border-[#B9804A]/30 px-6 pb-6">
                        <h2 className="text-lg font-semibold text-[#5E3A1E] mb-4">
                            Datos de envio
                        </h2>
                        <div className="p-4 bg-[#F9E3C8]/50 rounded-xl text-sm text-[#6F4A2A] space-y-2">
                            <p>
                                <strong>Nombre:</strong> {customer.name}
                            </p>
                            <p>
                                <strong>Telefono:</strong> {customer.phone}
                            </p>
                            <p>
                                <strong>Email:</strong> {customer.email}
                            </p>
                            <p>
                                <strong>Direccion:</strong> {customer.address}
                                {customer.neighborhood && `, ${customer.neighborhood}`}
                            </p>
                            <p>
                                <strong>Ciudad:</strong> {customer.locality}
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="bg-[#5E3A1E] rounded-b-3xl p-6 text-center">
                    <p className="text-[#F9E3C8] text-sm mb-4">
                        ¿Tienes alguna pregunta sobre tu pedido?
                    </p>
                    <a
                        href="https://wa.me/573001234567"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#F9E3C8] text-[#5E3A1E] text-sm font-medium hover:bg-white transition"
                    >
                        Escribenos por WhatsApp
                    </a>
                    <div className="mt-4">
                        <Link
                            href="/products"
                            className="text-[#B9804A] text-sm hover:text-[#F9E3C8] transition"
                        >
                            Volver a la tienda
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

function LoadingFallback() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-[#E6C29A] px-4">
            <div className="max-w-lg w-full bg-[#F9E3C8] rounded-3xl shadow-2xl border border-[#B9804A]/30 p-8 text-center">
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

export default function MiPedidoPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <MiPedidoContent />
        </Suspense>
    );
}
