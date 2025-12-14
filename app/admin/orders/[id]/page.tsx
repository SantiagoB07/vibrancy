// app/admin/orders/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Phone, Mail, MapPin, ExternalLink } from "lucide-react";
import OrderStatusChanger from "./OrderStatusChanger";

interface OrderItem {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    line_total: number;
    personalization_front: string | null;
    personalization_back: string | null;
    engraving_font: string | null;
    products: {
        id: number;
        title: string;
        description: string | null;
    } | null;
    photos: {
        order_item_id: number;
        storage_path: string;
        public_url: string | null;
        position: number;
    }[];
}

interface Customer {
    id: number;
    name: string;
    phone: string | number | null;
    email: string | null;
    address: string | null;
    neighborhood: string | null;
    locality: string | null;
}

interface Order {
    id: number;
    status: string;
    total_amount: number;
    currency: string;
    payment_method: string | null;
    mp_preference_id: string | null;
    mp_payment_status: string | null;
    access_token: string;
    created_at: string;
    updated_at: string;
    customer_id: number | null;
}

export default async function AdminOrderDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
        notFound();
    }

    const supabase = await createClient();

    // Obtener la orden
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

    if (orderError || !order) {
        console.error("Error fetching order:", orderError);
        notFound();
    }

    // Obtener items de la orden
    const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select(`
            id,
            product_id,
            product_variant_id,
            quantity,
            unit_price,
            line_total,
            personalization_front,
            personalization_back,
            engraving_font,
            products (
                id,
                title,
                description
            )
        `)
        .eq("order_id", orderId);

    if (itemsError) {
        console.error("Error fetching items:", itemsError);
    }

    // Obtener fotos de los items
    const itemIds = items?.map((item) => item.id) || [];
    let photos: { order_item_id: number; storage_path: string; public_url: string | null; position: number }[] = [];

    if (itemIds.length > 0) {
        const { data: photosData, error: photosError } = await supabase
            .from("order_item_photos")
            .select("order_item_id, storage_path, public_url, position")
            .in("order_item_id", itemIds);

        if (photosError) {
            console.error("Error fetching photos:", photosError);
        } else {
            photos = photosData || [];
        }
    }

    // Agregar fotos a cada item
    const itemsWithPhotos: OrderItem[] = items?.map((item) => {
        // Supabase puede devolver products como array o objeto dependiendo de la relación
        const productData = Array.isArray(item.products) 
            ? item.products[0] 
            : item.products;
        return {
            ...item,
            products: productData as OrderItem["products"],
            photos: photos.filter((p) => p.order_item_id === item.id),
        };
    }) || [];

    // Obtener datos del cliente
    let customer: Customer | null = null;
    if (order.customer_id) {
        const { data: customerData, error: customerError } = await supabase
            .from("customers")
            .select("id, name, phone, email, address, neighborhood, locality")
            .eq("id", order.customer_id)
            .single();

        if (customerError) {
            console.error("Error fetching customer:", customerError);
        } else {
            customer = customerData;
        }
    }

    // URL de consulta pública del pedido
    const publicOrderUrl = `/mi-pedido/${order.id}?token=${order.access_token}`;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/orders"
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Pedido #{order.id}
                        </h1>
                        <p className="text-gray-500">
                            {new Date(order.created_at).toLocaleDateString("es-CO", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </p>
                    </div>
                </div>
                <Link
                    href={publicOrderUrl}
                    target="_blank"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                    Ver como cliente <ExternalLink className="w-4 h-4" />
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Status */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Estado del Pedido
                        </h2>
                        <OrderStatusChanger 
                            orderId={order.id} 
                            currentStatus={order.status} 
                        />
                    </div>

                    {/* Order Items */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Productos ({itemsWithPhotos.length})
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {itemsWithPhotos.map((item) => (
                                <div key={item.id} className="p-6">
                                    <div className="flex gap-4">
                                        {/* Product Photos */}
                                        {item.photos.length > 0 && (
                                            <div className="flex gap-2 flex-shrink-0">
                                                {item.photos.map((photo, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={photo.public_url || "#"}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block"
                                                    >
                                                        <Image
                                                            src={photo.public_url || "/placeholder.png"}
                                                            alt={`Foto ${idx + 1}`}
                                                            width={80}
                                                            height={80}
                                                            className="rounded-lg object-cover border border-gray-200"
                                                        />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* Product Info */}
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900">
                                                {item.products?.title || `Producto #${item.product_id}`}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Cantidad: {item.quantity} × ${(item.unit_price ?? 0).toLocaleString("es-CO")}
                                            </p>
                                            
                                            {/* Personalizations */}
                                            <div className="mt-3 space-y-2">
                                                {item.personalization_front && (
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                                            Grabado Frente
                                                        </p>
                                                        <p className="text-sm text-gray-900 font-medium">
                                                            {item.personalization_front}
                                                        </p>
                                                    </div>
                                                )}
                                                {item.personalization_back && (
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                                            Grabado Atrás
                                                        </p>
                                                        <p className="text-sm text-gray-900 font-medium">
                                                            {item.personalization_back}
                                                        </p>
                                                    </div>
                                                )}
                                                {item.engraving_font && (
                                                    <p className="text-xs text-gray-500">
                                                        Fuente: <span className="font-medium">{item.engraving_font}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Line Total */}
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">
                                                ${(item.line_total ?? 0).toLocaleString("es-CO")}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Order Summary */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Resumen
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="font-semibold text-gray-900">Total</span>
                                <span className="font-bold text-lg text-gray-900">
                                    ${order.total_amount.toLocaleString("es-CO")}
                                </span>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-500">Método de pago</p>
                            <p className="font-medium text-gray-900 capitalize">
                                {order.payment_method === "mercadopago" 
                                    ? "Mercado Pago" 
                                    : order.payment_method || "No seleccionado"}
                            </p>
                            {order.mp_payment_id && (
                                <p className="text-xs text-gray-400 mt-1">
                                    ID Pago: {order.mp_payment_id}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Customer Info */}
                    {customer && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Cliente
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="font-medium text-gray-900">{customer.name}</p>
                                </div>
                                
                                {customer.phone && (
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <a 
                                            href={`https://wa.me/57${String(customer.phone).replace(/\D/g, "")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary hover:underline"
                                        >
                                            {customer.phone}
                                        </a>
                                    </div>
                                )}
                                
                                {customer.email && (
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <a 
                                            href={`mailto:${customer.email}`}
                                            className="text-sm text-primary hover:underline"
                                        >
                                            {customer.email}
                                        </a>
                                    </div>
                                )}
                                
                                {(customer.address || customer.neighborhood || customer.locality) && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                        <div className="text-sm text-gray-600">
                                            {customer.address && <p>{customer.address}</p>}
                                            {customer.neighborhood && <p>{customer.neighborhood}</p>}
                                            {customer.locality && <p>{customer.locality}</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Fechas
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-gray-500">Creado</p>
                                <p className="text-gray-900">
                                    {new Date(order.created_at).toLocaleString("es-CO")}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500">Última actualización</p>
                                <p className="text-gray-900">
                                    {new Date(order.updated_at).toLocaleString("es-CO")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
