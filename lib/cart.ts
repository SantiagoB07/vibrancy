"use client";

import { createClient } from "./supabase/client";

// Obtener o crear carrito anónimo
export async function getOrCreateCart(): Promise<number | null> {
    const supabase = createClient();
    let cartId = localStorage.getItem("cart_id");

    if (!cartId) {
        const { data, error } = await supabase.from("cart").insert({}).select("id").single();
        if (error || !data) return null;
        cartId = String(data.id);
        localStorage.setItem("cart_id", cartId);
    }
    return Number(cartId);
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
