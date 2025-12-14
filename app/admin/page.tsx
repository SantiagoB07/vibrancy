// app/admin/page.tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { 
    Package, 
    Clock, 
    CreditCard, 
    Truck, 
    CheckCircle, 
    XCircle,
    ArrowRight,
    DollarSign
} from "lucide-react";

interface OrderStats {
    status: string;
    count: number;
}

const STATUS_CONFIG: Record<string, { 
    label: string; 
    icon: React.ComponentType<{ className?: string }>; 
    color: string;
    bgColor: string;
}> = {
    PENDING_PAYMENT: {
        label: "Pendientes de Pago",
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
    },
    PENDING_TRANSFER: {
        label: "Esperando Transferencia",
        icon: CreditCard,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
    },
    PAID: {
        label: "Pagados",
        icon: DollarSign,
        color: "text-green-600",
        bgColor: "bg-green-50",
    },
    IN_PRODUCTION: {
        label: "En Producción",
        icon: Package,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
    },
    SHIPPED: {
        label: "Enviados",
        icon: Truck,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
    },
    DELIVERED: {
        label: "Entregados",
        icon: CheckCircle,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
    },
    CANCELLED: {
        label: "Cancelados",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
    },
    PAYMENT_REJECTED: {
        label: "Pago Rechazado",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
    },
};

export default async function AdminDashboard() {
    const supabase = await createClient();

    // Obtener conteo de pedidos por estado
    const { data: statsData, error } = await supabase
        .from("orders")
        .select("status");

    if (error) {
        console.error("Error fetching order stats:", error);
    }

    // Agrupar por estado
    const stats: Record<string, number> = {};
    statsData?.forEach((order) => {
        stats[order.status] = (stats[order.status] || 0) + 1;
    });

    // Calcular totales
    const totalOrders = statsData?.length || 0;
    const pendingOrders = (stats["PENDING_PAYMENT"] || 0) + (stats["PENDING_TRANSFER"] || 0);
    const activeOrders = (stats["PAID"] || 0) + (stats["IN_PRODUCTION"] || 0) + (stats["SHIPPED"] || 0);

    // Obtener últimos 5 pedidos
    const { data: recentOrders } = await supabase
        .from("orders")
        .select(`
            id,
            status,
            total_amount,
            created_at,
            customer_id,
            customers (
                name,
                email
            )
        `)
        .order("created_at", { ascending: false })
        .limit(5);

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">
                    Resumen de tu tienda Vibrancy Accesorios
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Pedidos</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{totalOrders}</p>
                        </div>
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Pendientes</p>
                            <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingOrders}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">En Proceso</p>
                            <p className="text-3xl font-bold text-blue-600 mt-1">{activeOrders}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                            <Truck className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats by Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Pedidos por Estado</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
                    {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                        const Icon = config.icon;
                        const count = stats[status] || 0;
                        return (
                            <Link
                                key={status}
                                href={`/admin/orders?status=${status}`}
                                className={`${config.bgColor} rounded-lg p-4 hover:opacity-80 transition-opacity`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className={`w-5 h-5 ${config.color}`} />
                                    <span className={`text-2xl font-bold ${config.color}`}>
                                        {count}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">{config.label}</p>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Pedidos Recientes</h2>
                    <Link 
                        href="/admin/orders"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                        Ver todos <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="divide-y divide-gray-100">
                    {recentOrders && recentOrders.length > 0 ? (
                        recentOrders.map((order) => {
                            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING_PAYMENT;
                            const Icon = statusConfig.icon;
                            // Supabase puede devolver customers como array o objeto
                            const customerData = Array.isArray(order.customers) 
                                ? order.customers[0] 
                                : order.customers;
                            const customer = customerData as { name: string; email: string } | null;
                            return (
                                <Link
                                    key={order.id}
                                    href={`/admin/orders/${order.id}`}
                                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 ${statusConfig.bgColor} rounded-full flex items-center justify-center`}>
                                            <Icon className={`w-5 h-5 ${statusConfig.color}`} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                Pedido #{order.id}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {customer?.name || "Sin cliente"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900">
                                            ${order.total_amount?.toLocaleString("es-CO") || 0}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(order.created_at).toLocaleDateString("es-CO", {
                                                day: "numeric",
                                                month: "short",
                                            })}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            No hay pedidos aún
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
