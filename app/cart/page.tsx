"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingBag, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { getCart, removeFromCart, clearCart, getCartTotal, LocalCartItem } from "@/lib/local-cart";
import { CustomerForm, CustomerData } from "@/components/checkout/CustomerForm";
import { formatCOP } from "@/lib/utils";

function imgUrl(img?: string) {
    if (!img) return "/images/04.png";
    if (img.startsWith("http")) return img;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${img}`;
}

export default function CartPage() {
    const router = useRouter();
    const [items, setItems] = useState<LocalCartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState<1 | 2>(1); // 1: carrito, 2: datos de envío
    const [isPaying, setIsPaying] = useState(false);

    const [customerData, setCustomerData] = useState<CustomerData>({
        name: "",
        phone: "",
        email: "",
        address: "",
        neighborhood: "",
        locality: "",
    });

    const isCustomerFormValid =
        customerData.name.trim().length > 2 &&
        customerData.phone.trim().length >= 7 &&
        customerData.address.trim().length > 5 &&
        customerData.locality.trim().length > 2;

    useEffect(() => {
        setItems(getCart());
        setLoading(false);

        // Escuchar cambios en el carrito
        const handleCartUpdate = () => {
            setItems(getCart());
        };
        window.addEventListener("cart-updated", handleCartUpdate);
        return () => window.removeEventListener("cart-updated", handleCartUpdate);
    }, []);

    const handleRemove = (itemId: string) => {
        removeFromCart(itemId);
        toast.success("Producto eliminado del carrito");
    };

    const handleCheckout = async () => {
        if (!isCustomerFormValid) {
            toast.error("Por favor completa todos los campos requeridos");
            return;
        }

        setIsPaying(true);

        try {
            // Convertir items del carrito al formato que espera el API
            const checkoutItems = items.map(item => ({
                productId: item.productId,
                productVariantId: item.productVariantId ?? null,
                quantity: item.quantity,
                title: item.title,
                personalizationFront: item.personalizationFront ?? null,
                personalizationBack: item.personalizationBack ?? null,
                engravingFont: item.engravingFont ?? null,
                selectedAddons: item.selectedAddons ?? [],
            }));

            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerData: {
                        name: customerData.name,
                        phone: customerData.phone,
                        email: customerData.email || null,
                        address: customerData.address,
                        neighborhood: customerData.neighborhood || null,
                        locality: customerData.locality || null,
                    },
                    items: checkoutItems,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Error al procesar el pago");
            }

            const data = await res.json();

            // Limpiar carrito
            clearCart();

            // Redirigir a selección de método de pago
            const params = new URLSearchParams({
                order_id: String(data.order_id),
                token: data.access_token,
                init_point: data.init_point,
            });
            router.push(`/checkout/payment-method?${params}`);

        } catch (error) {
            console.error("Error en checkout:", error);
            toast.error(error instanceof Error ? error.message : "Error al procesar el pago");
            setIsPaying(false);
        }
    };

    const total = getCartTotal();

    // Helper para formatear configuración del llavero (productId === 3)
    function renderKeychainDetails(jsonString: string): string[] | null {
        try {
            const config = JSON.parse(jsonString);
            const details: string[] = [];

            if (config.base) {
                const colorName = config.base.color === "black" ? "Negro" : "Plateado";
                details.push(`Base ${colorName}${config.base.text ? `: "${config.base.text}"` : ""}`);
            }
            if (config.helmet) {
                const colorName = config.helmet.color === "black" ? "Negro" : "Plateado";
                details.push(`Casco ${colorName}${config.helmet.text ? `: "${config.helmet.text}"` : ""}`);
            }
            if (config.small) {
                const colorName = config.small.color === "black" ? "Negro" : "Plateado";
                details.push(`Placa ${colorName}${config.small.text ? `: "${config.small.text}"` : ""}`);
            }
            if (config.moto) {
                const colorName = config.moto.color === "black" ? "Negro" : "Plateado";
                details.push(`Moto ${colorName}`);
            }
            if (config.photoEngraving?.hasPhoto) {
                details.push("Fotograbado: Sí");
            }
            if (config.vectorDesign?.name) {
                details.push(`Diseño: ${config.vectorDesign.name}`);
            }

            return details.length > 0 ? details : null;
        } catch {
            // No es JSON válido, retornar null
            return null;
        }
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-[#E6C29A] flex items-center justify-center">
                <div className="text-[#5E3A1E] text-lg">Cargando carrito...</div>
            </div>
        );
    }

    // Carrito vacío
    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[#E6C29A] flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-[#F9E3C8] rounded-3xl shadow-2xl border border-[#B9804A]/30 p-8 text-center">
                    <ShoppingBag className="w-16 h-16 text-[#B9804A] mx-auto mb-4" />
                    <h1 className="text-2xl font-semibold text-[#5E3A1E] mb-2">
                        Tu carrito está vacío
                    </h1>
                    <p className="text-sm text-[#6F4A2A] mb-6">
                        Agrega algunos productos personalizados para comenzar
                    </p>
                    <Link
                        href="/products"
                        className="inline-flex items-center justify-center w-full py-3 rounded-full bg-[#5E3A1E] text-[#F9E3C8] font-medium hover:bg-[#4C2F18] transition"
                    >
                        Ver productos
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#E6C29A] py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-[#F9E3C8] rounded-t-3xl shadow-lg border border-[#B9804A]/30 p-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-[#5E3A1E]">
                            {step === 1 ? "Mi Carrito" : "Datos de Envío"}
                        </h1>
                        <span className="text-sm text-[#7C5431]">
                            {items.length} {items.length === 1 ? "producto" : "productos"}
                        </span>
                    </div>

                    {/* Progress indicator */}
                    <div className="flex items-center gap-2 mt-4">
                        <div className={`flex-1 h-1 rounded-full ${step >= 1 ? "bg-[#5E3A1E]" : "bg-[#B9804A]/30"}`} />
                        <div className={`flex-1 h-1 rounded-full ${step >= 2 ? "bg-[#5E3A1E]" : "bg-[#B9804A]/30"}`} />
                    </div>
                    <div className="flex justify-between text-xs text-[#7C5431] mt-1">
                        <span>Carrito</span>
                        <span>Datos de envío</span>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white border-x border-[#B9804A]/30">
                    {step === 1 ? (
                        /* Paso 1: Lista de productos */
                        <div className="divide-y divide-[#E6C29A]">
                            {items.map((item) => (
                                <div key={item.id} className="p-4 flex gap-4">
                                    {/* Imagen */}
                                    <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-[#F9E3C8]">
                                        <Image
                                            src={imgUrl(item.productImage)}
                                            alt={item.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-[#5E3A1E] truncate">
                                            {item.title}
                                        </h3>
                                        
                                        {item.variantName && (
                                            <p className="text-xs text-[#7C5431]">
                                                Variante: {item.variantName}
                                            </p>
                                        )}

                                        {/* Personalizaciones */}
                                        {(item.personalizationFront || item.personalizationBack) && (
                                            <div className="mt-1 text-xs text-[#6F4A2A] space-y-0.5">
                                                {item.personalizationFront && item.productId !== 3 && (
                                                    <p className="truncate">
                                                        <span className="font-medium">Texto 1:</span> {item.personalizationFront}
                                                    </p>
                                                )}
                                                {item.personalizationBack && (
                                                    (() => {
                                                        const keychainDetails = item.productId === 3
                                                            ? renderKeychainDetails(item.personalizationBack)
                                                            : null;

                                                        if (keychainDetails) {
                                                            return (
                                                                <div className="space-y-0.5">
                                                                    {keychainDetails.map((detail, idx) => (
                                                                        <p key={idx}>• {detail}</p>
                                                                    ))}
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <p className="truncate">
                                                                <span className="font-medium">Texto 2:</span> {item.personalizationBack}
                                                            </p>
                                                        );
                                                    })()
                                                )}
                                            </div>
                                        )}

                                        {item.engravingFont && (
                                            <p className="text-xs text-[#7C5431] mt-0.5">
                                                Fuente: {item.engravingFont}
                                            </p>
                                        )}

                                        <p className="text-sm font-semibold text-[#5E3A1E] mt-2">
                                            {formatCOP(item.unitPrice)} × {item.quantity}
                                        </p>
                                    </div>

                                    {/* Precio y eliminar */}
                                    <div className="flex flex-col items-end justify-between">
                                        <p className="font-bold text-[#5E3A1E]">
                                            {formatCOP(item.unitPrice * item.quantity)}
                                        </p>
                                        <button
                                            onClick={() => handleRemove(item.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
                                            aria-label="Eliminar producto"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Paso 2: Datos de envío */
                        <div className="p-6">
                            <CustomerForm data={customerData} onChange={setCustomerData} />

                            {/* Resumen del pedido */}
                            <div className="mt-6 p-4 bg-[#F9E3C8]/50 rounded-xl">
                                <h3 className="font-semibold text-[#5E3A1E] mb-2">Resumen del pedido</h3>
                                <div className="space-y-1 text-sm text-[#6F4A2A]">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex justify-between">
                                            <span className="truncate flex-1 mr-2">
                                                {item.title} × {item.quantity}
                                            </span>
                                            <span className="font-medium">
                                                {formatCOP(item.unitPrice * item.quantity)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer con total y botones */}
                <div className="bg-[#F9E3C8] rounded-b-3xl shadow-lg border border-[#B9804A]/30 p-6">
                    {/* Total */}
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-semibold text-[#5E3A1E]">Total</span>
                        <span className="text-2xl font-bold text-[#5E3A1E]">
                            {formatCOP(total)}
                        </span>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3">
                        {step === 1 ? (
                            <>
                                <Link
                                    href="/products"
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full border-2 border-[#5E3A1E] text-[#5E3A1E] font-medium hover:bg-[#5E3A1E]/10 transition"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Seguir comprando
                                </Link>
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-[#5E3A1E] text-[#F9E3C8] font-medium hover:bg-[#4C2F18] transition"
                                >
                                    Continuar
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full border-2 border-[#5E3A1E] text-[#5E3A1E] font-medium hover:bg-[#5E3A1E]/10 transition"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Volver
                                </button>
                                <button
                                    onClick={handleCheckout}
                                    disabled={!isCustomerFormValid || isPaying}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-[#5E3A1E] text-[#F9E3C8] font-medium hover:bg-[#4C2F18] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPaying ? "Procesando..." : "Confirmar y pagar"}
                                    {!isPaying && <ArrowRight className="w-4 h-4" />}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
