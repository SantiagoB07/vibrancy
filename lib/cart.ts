"use client";

import { createClient } from "./supabase/client";

// In-process singleton promise to avoid duplicate cart creation on concurrent calls
let cartCreationPromise: Promise<number | null> | null = null;

// Obtener o crear carrito anónimo con control de concurrencia y validación de cache
export async function getOrCreateCart(): Promise<number | null> {
    const supabase = createClient();

    // 1) Intentar leer desde localStorage y validar
    try {
        const raw = typeof window !== "undefined" ? localStorage.getItem("cart_id") : null;
        const parsed = raw != null ? Number(raw) : null;
        if (parsed != null && Number.isFinite(parsed) && parsed > 0) {
            return parsed;
        }
        // Si es inválido, limpiarlo para evitar usarlo
        if (raw != null) {
            localStorage.removeItem("cart_id");
        }
    } catch (e) {
        // Si el acceso a localStorage falla por alguna razón, seguimos a creación remota
        console.warn("Advertencia accediendo a localStorage(cart_id)", e);
    }

    // 2) Si ya hay una creación en curso, esperar la misma promesa
    if (cartCreationPromise) {
        return cartCreationPromise;
    }

    // 3) Crear una nueva promesa de creación para consolidar llamadas concurrentes
    cartCreationPromise = (async () => {
        try {
            const { data, error } = await supabase
                .from("cart")
                .insert({})
                .select("id")
                .single();

            if (error || !data) {
                console.error("❌ Error creando carrito anónimo:", error?.message ?? "Respuesta vacía");
                try {
                    localStorage.removeItem("cart_id");
                } catch {
                    // ignorar
                }
                return null;
            }

            const newId = Number(data.id);
            if (!Number.isFinite(newId) || newId <= 0) {
                console.error("❌ ID de carrito inválido recibido:", data.id);
                try {
                    localStorage.removeItem("cart_id");
                } catch {
                    // ignorar
                }
                return null;
            }

            try {
                localStorage.setItem("cart_id", String(newId));
            } catch (e) {
                console.warn("Advertencia guardando cart_id en localStorage", e);
            }

            return newId;
        } catch (e) {
            console.error("❌ Excepción creando carrito anónimo:", e);
            try {
                localStorage.removeItem("cart_id");
            } catch {
                // ignorar
            }
            return null;
        } finally {
            // Asegurar que liberamos el lock para futuras llamadas
            cartCreationPromise = null;
        }
    })();

    return cartCreationPromise;
}

export async function addToCart(productId: number, quantity = 1): Promise<boolean> {
    const supabase = createClient();
    const cartId = await getOrCreateCart();
    if (!cartId) return false;

    const { error } = await supabase.from("cart_items").upsert(
        { cart_id: cartId, product_id: productId, quantity },
        { onConflict: "cart_id,product_id" }
    );

    return !error;
}

// Eliminar producto del carrito (solo query, sin React)
export async function removeFromCart(itemId: number) {
    const supabase = createClient();

    const { error } = await supabase.from("cart_items").delete().eq("id", itemId);

    if (error) {
        console.error("❌ Error eliminando producto:", error.message);
        return false;
    }

    console.log("🗑️ Producto eliminado del carrito:", itemId);
    return true;
}
