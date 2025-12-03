"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { formatCOP } from "@/lib/utils";
import { removeFromCart } from "@/lib/cart";

interface CartItem {
    id: number;
    quantity: number;
    products: {
        id: number;
        title: string;
        img?: string;
        price: number;
    };
}

function imgUrl(img?: string) {
    if (!img) return "/images/04.png";
    if (img.startsWith("http")) return img;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${img}`;
}

export default function CartPage() {
    const [items, setItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCart = async () => {
            const supabase = createClient();
            const cartId = localStorage.getItem("cart_id");

            if (!cartId) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from("cart_items")
                .select("id, quantity, products(id, title, img, price)")
                .eq("cart_id", cartId);

            if (error) {
                console.error("Error cargando carrito:", error.message);
            } else {
                setItems(data as unknown as CartItem[]);
            }

            setLoading(false);
        };

        fetchCart();
    }, []);

    const handleRemove = async (itemId: number) => {
        const ok = await removeFromCart(itemId);
        if (ok) {
            setItems((prev) => prev.filter((item) => item.id !== itemId));
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Mi Carrito</h2>

            {loading ? (
                <p className="text-gray-500">Cargando carrito...</p>
            ) : items.length === 0 ? (
                <p className="text-gray-500">Tu carrito está vacío</p>
            ) : (
                <ul className="space-y-4">
                    {items.map((item) => (
                        <li
                            key={item.id}
                            className="flex items-center gap-4 p-4 border rounded-lg bg-white shadow-sm"
                        >
                            <div className="relative w-20 h-20 flex-shrink-0">
                                <Image
                                    src={imgUrl(item.products.img)}
                                    alt={item.products.title}
                                    fill
                                    className="object-cover rounded-md"
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-amber-900">
                                    {item.products.title}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {formatCOP(item.products.price)} × {item.quantity}
                                </p>
                            </div>

                            {/* Botón eliminar */}
                            <button
                                onClick={() => handleRemove(item.id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                                Eliminar
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
