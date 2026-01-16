"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCartCount } from "@/lib/local-cart";

export function CartIcon() {
    const [count, setCount] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Cargar conteo inicial
        setCount(getCartCount());

        // Escuchar cambios en el carrito
        const handleCartUpdate = () => {
            setCount(getCartCount());
        };

        window.addEventListener("cart-updated", handleCartUpdate);
        
        // También escuchar cambios en localStorage desde otras pestañas
        const handleStorage = (e: StorageEvent) => {
            if (e.key === "vibrancy_cart") {
                setCount(getCartCount());
            }
        };
        window.addEventListener("storage", handleStorage);

        return () => {
            window.removeEventListener("cart-updated", handleCartUpdate);
            window.removeEventListener("storage", handleStorage);
        };
    }, []);

    // No mostrar nada hasta que esté montado (evita hydration mismatch)
    if (!mounted) {
        return (
            <div className="relative p-2">
                <ShoppingCart className="h-6 w-6 text-amber-900" />
            </div>
        );
    }

    return (
        <Link 
            href="/cart" 
            className="relative p-2 hover:bg-amber-200 rounded-full transition-colors"
            aria-label={`Carrito de compras${count > 0 ? `, ${count} productos` : ""}`}
        >
            <ShoppingCart className="h-6 w-6 text-amber-900" />
            
            {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-md animate-in zoom-in-50 duration-200">
                    {count > 99 ? "99+" : count}
                </span>
            )}
        </Link>
    );
}
