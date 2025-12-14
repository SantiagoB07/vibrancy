// app/admin/orders/page.tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { 
    Package, 
    Clock, 
    CreditCard, 
    Truck, 
    CheckCircle, 
    XCircle,
    DollarSign,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

interface SearchParams {
    status?: string;
    search?: string;
    page?: string;
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
        badgeClass: "bg-yellow-100 text-yellow-800",
    },
    PENDING_TRANSFER: {
        label: "Esperando Transferencia",
        icon: CreditCard,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        badgeClass: "bg-orange-100 text-orange-800",
    },
    PAID: {
        label: "Pagado",
        icon: DollarSign,
        color: "text-green-600",
        bgColor: "bg-green-50",
        badgeClass: "bg-green-100 text-green-800",
    },
    IN_PRODUCTION: {
        label: "En Producción",
        icon: Package,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        badgeClass: "bg-blue-100 text-blue-800",
    },
    SHIPPED: {
        label: "Enviado",
        icon: Truck,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        badgeClass: "bg-purple-100 text-purple-800",
    },
    DELIVERED: {
        label: "Entregado",
        icon: CheckCircle,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        badgeClass: "bg-emerald-100 text-emerald-800",
    },
    CANCELLED: {
        label: "Cancelado",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        badgeClass: "bg-red-100 text-red-800",
    },
    PAYMENT_REJECTED: {
        label: "Pago Rechazado",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        badgeClass: "bg-red-100 text-red-800",
    },
};

const ITEMS_PER_PAGE = 20;

export default async function AdminOrdersPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;
    const statusFilter = params.status || "";
    const searchQuery = params.search || "";
    const currentPage = parseInt(params.page || "1");

    const supabase = await createClient();

    // Construir query base
    let query = supabase
        .from("orders")
        .select(`
            id,
            status,
            total_amount,
            payment_method,
            created_at,
            updated_at,
            customer_id,
            customers (
                name,
                email,
                phone
            )
        `, { count: "exact" });

    // Aplicar filtro de estado
    if (statusFilter) {
        query = query.eq("status", statusFilter);
    }

    // Aplicar búsqueda por ID
    if (searchQuery) {
        const searchId = parseInt(searchQuery);
        if (!isNaN(searchId)) {
            query = query.eq("id", searchId);
        }
    }

    // Ordenar y paginar
    query = query
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

    const { data: orders, count, error } = await query;

    if (error) {
        console.error("Error fetching orders:", error);
    }

    const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE);

    // Función para construir URL con parámetros
    const buildUrl = (newParams: Partial<SearchParams>) => {
        const merged = { ...params, ...newParams };
        const urlParams = new URLSearchParams();
        if (merged.status) urlParams.set("status", merged.status);
        if (merged.search) urlParams.set("search", merged.search);
        if (merged.page && merged.page !== "1") urlParams.set("page", merged.page);
        const queryString = urlParams.toString();
        return `/admin/orders${queryString ? `?${queryString}` : ""}`;
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
                    <p className="text-gray-500 mt-1">
                        {count || 0} pedidos en total
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <form className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                name="search"
                                placeholder="Buscar por # de pedido..."
                                defaultValue={searchQuery}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                    </form>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href={buildUrl({ status: "", page: "1" })}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                    !statusFilter 
                                        ? "bg-gray-900 text-white" 
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                Todos
                            </Link>
                            {Object.entries(STATUS_CONFIG).slice(0, 6).map(([status, config]) => (
                                <Link
                                    key={status}
                                    href={buildUrl({ status, page: "1" })}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                        statusFilter === status 
                                            ? "bg-gray-900 text-white" 
                                            : `${config.bgColor} ${config.color} hover:opacity-80`
                                    }`}
                                >
                                    {config.label.split(" ")[0]}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Pedido
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Cliente
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Método de Pago
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Fecha
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders && orders.length > 0 ? (
                                orders.map((order) => {
                                    const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING_PAYMENT;
                                    // Supabase puede devolver customers como array o objeto
                                    const customerData = Array.isArray(order.customers) 
                                        ? order.customers[0] 
                                        : order.customers;
                                    const customer = customerData as { name: string; email: string; phone: string } | null;
                                    return (
                                        <tr 
                                            key={order.id} 
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <Link 
                                                    href={`/admin/orders/${order.id}`}
                                                    className="font-medium text-primary hover:underline"
                                                >
                                                    #{order.id}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {customer?.name || "Sin nombre"}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {customer?.phone || customer?.email || "Sin contacto"}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.badgeClass}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                ${order.total_amount?.toLocaleString("es-CO") || 0}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 capitalize">
                                                {order.payment_method === "mercadopago" 
                                                    ? "Mercado Pago" 
                                                    : order.payment_method || "—"}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">
                                                {new Date(order.created_at).toLocaleDateString("es-CO", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No se encontraron pedidos
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Página {currentPage} de {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            {currentPage > 1 && (
                                <Link
                                    href={buildUrl({ page: String(currentPage - 1) })}
                                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                                </Link>
                            )}
                            {currentPage < totalPages && (
                                <Link
                                    href={buildUrl({ page: String(currentPage + 1) })}
                                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5 text-gray-600" />
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
