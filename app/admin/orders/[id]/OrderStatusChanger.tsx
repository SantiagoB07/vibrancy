"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
    Package, 
    Clock, 
    CreditCard, 
    Truck, 
    CheckCircle, 
    XCircle,
    DollarSign,
    ChevronDown,
    Loader2
} from "lucide-react";

interface OrderStatusChangerProps {
    orderId: number;
    currentStatus: string;
}

const STATUS_CONFIG: Record<string, { 
    label: string; 
    icon: React.ComponentType<{ className?: string }>; 
    color: string;
    bgColor: string;
    badgeClass: string;
}> = {
    PENDING_PAYMENT: {
        label: "Pendiente de Pago",
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    PENDING_TRANSFER: {
        label: "Esperando Transferencia",
        icon: CreditCard,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
    },
    PAID: {
        label: "Pagado",
        icon: DollarSign,
        color: "text-green-600",
        bgColor: "bg-green-50",
        badgeClass: "bg-green-100 text-green-800 border-green-200",
    },
    IN_PRODUCTION: {
        label: "En Producción",
        icon: Package,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    },
    SHIPPED: {
        label: "Enviado",
        icon: Truck,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
    },
    DELIVERED: {
        label: "Entregado",
        icon: CheckCircle,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    CANCELLED: {
        label: "Cancelado",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        badgeClass: "bg-red-100 text-red-800 border-red-200",
    },
    PAYMENT_REJECTED: {
        label: "Pago Rechazado",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        badgeClass: "bg-red-100 text-red-800 border-red-200",
    },
};

// Transiciones válidas de estado
const VALID_TRANSITIONS: Record<string, string[]> = {
    PENDING_PAYMENT: ["PAID", "PENDING_TRANSFER", "CANCELLED"],
    PENDING_TRANSFER: ["PAID", "CANCELLED"],
    PAID: ["IN_PRODUCTION", "CANCELLED"],
    IN_PRODUCTION: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED", "CANCELLED"],
    DELIVERED: [], // Estado final
    CANCELLED: [], // Estado final
    PAYMENT_REJECTED: ["PENDING_PAYMENT"], // Puede reintentar
};

export default function OrderStatusChanger({ 
    orderId, 
    currentStatus 
}: OrderStatusChangerProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.PENDING_PAYMENT;
    const CurrentIcon = currentConfig.icon;
    const availableTransitions = VALID_TRANSITIONS[currentStatus] || [];

    const handleStatusChange = async (newStatus: string) => {
        setError(null);
        setIsOpen(false);

        try {
            const response = await fetch(`/api/admin/orders/${orderId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Error al actualizar estado");
            }

            startTransition(() => {
                router.refresh();
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
        }
    };

    return (
        <div className="space-y-4">
            {/* Current Status */}
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${currentConfig.bgColor} rounded-full flex items-center justify-center`}>
                    <CurrentIcon className={`w-6 h-6 ${currentConfig.color}`} />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Estado actual</p>
                    <p className={`font-semibold ${currentConfig.color}`}>
                        {currentConfig.label}
                    </p>
                </div>
            </div>

            {/* Status Changer */}
            {availableTransitions.length > 0 && (
                <div className="relative">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        disabled={isPending}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors disabled:opacity-50"
                    >
                        <span className="text-sm font-medium text-gray-700">
                            {isPending ? "Actualizando..." : "Cambiar estado"}
                        </span>
                        {isPending ? (
                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        ) : (
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        )}
                    </button>

                    {isOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 overflow-hidden">
                            {availableTransitions.map((status) => {
                                const config = STATUS_CONFIG[status];
                                const Icon = config.icon;
                                return (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusChange(status)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <div className={`w-8 h-8 ${config.bgColor} rounded-full flex items-center justify-center`}>
                                            <Icon className={`w-4 h-4 ${config.color}`} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">
                                            Marcar como: {config.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Final State Message */}
            {availableTransitions.length === 0 && (
                <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3">
                    Este pedido está en un estado final y no puede ser modificado.
                </p>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">
                    {error}
                </div>
            )}
        </div>
    );
}
