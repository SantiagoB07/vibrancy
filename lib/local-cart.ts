"use client";

// Tipos para el carrito local
export interface LocalCartItem {
    id: string;                         // UUID único para identificar el item
    productId: number;
    productVariantId?: number | null;
    variantName?: string;               // "Oro", "Plata", etc. (para mostrar)
    quantity: number;
    title: string;                      // Nombre del producto
    unitPrice: number;                  // Precio calculado (producto + addons)
    personalizationFront?: string | null;
    personalizationBack?: string | null;
    engravingFont?: string | null;
    selectedAddons?: number[];
    productImage?: string;              // URL de imagen del producto
    addedAt: number;                    // timestamp para ordenar y expiración
}

interface CartData {
    items: LocalCartItem[];
    updatedAt: number;
}

const CART_KEY = "vibrancy_cart";
const CART_EXPIRATION_DAYS = 7;

/**
 * Genera un UUID simple para identificar items del carrito
 */
function generateId(): string {
    return crypto.randomUUID ? crypto.randomUUID() : 
        `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Verifica si el carrito ha expirado (más de 7 días sin actualizar)
 */
function isCartExpired(updatedAt: number): boolean {
    const expirationMs = CART_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - updatedAt > expirationMs;
}

/**
 * Obtiene los datos del carrito desde localStorage
 */
function getCartData(): CartData {
    if (typeof window === "undefined") {
        return { items: [], updatedAt: Date.now() };
    }

    try {
        const raw = localStorage.getItem(CART_KEY);
        if (!raw) {
            return { items: [], updatedAt: Date.now() };
        }

        const data: CartData = JSON.parse(raw);
        
        // Si el carrito expiró, limpiarlo
        if (isCartExpired(data.updatedAt)) {
            localStorage.removeItem(CART_KEY);
            return { items: [], updatedAt: Date.now() };
        }

        return data;
    } catch (e) {
        console.error("Error leyendo carrito de localStorage:", e);
        return { items: [], updatedAt: Date.now() };
    }
}

/**
 * Guarda los datos del carrito en localStorage
 */
function saveCartData(items: LocalCartItem[]): void {
    if (typeof window === "undefined") return;

    try {
        const data: CartData = {
            items,
            updatedAt: Date.now(),
        };
        localStorage.setItem(CART_KEY, JSON.stringify(data));
        
        // Disparar evento custom para que otros componentes se actualicen
        window.dispatchEvent(new CustomEvent("cart-updated"));
    } catch (e) {
        console.error("Error guardando carrito en localStorage:", e);
    }
}

/**
 * Obtiene todos los items del carrito
 */
export function getCart(): LocalCartItem[] {
    const data = getCartData();
    // Ordenar por fecha de agregado (más reciente primero)
    return data.items.sort((a, b) => b.addedAt - a.addedAt);
}

/**
 * Agrega un item al carrito con su personalización
 */
export function addToCart(item: Omit<LocalCartItem, "id" | "addedAt">): void {
    const data = getCartData();
    
    const newItem: LocalCartItem = {
        ...item,
        id: generateId(),
        addedAt: Date.now(),
    };

    data.items.push(newItem);
    saveCartData(data.items);
}

/**
 * Elimina un item del carrito por su ID
 */
export function removeFromCart(itemId: string): void {
    const data = getCartData();
    const filteredItems = data.items.filter(item => item.id !== itemId);
    saveCartData(filteredItems);
}

/**
 * Actualiza la cantidad de un item
 */
export function updateQuantity(itemId: string, quantity: number): void {
    if (quantity < 1) {
        removeFromCart(itemId);
        return;
    }

    const data = getCartData();
    const updatedItems = data.items.map(item => 
        item.id === itemId ? { ...item, quantity } : item
    );
    saveCartData(updatedItems);
}

/**
 * Limpia todo el carrito
 */
export function clearCart(): void {
    if (typeof window === "undefined") return;
    
    try {
        localStorage.removeItem(CART_KEY);
        window.dispatchEvent(new CustomEvent("cart-updated"));
    } catch (e) {
        console.error("Error limpiando carrito:", e);
    }
}

/**
 * Obtiene la cantidad total de items en el carrito
 */
export function getCartCount(): number {
    const items = getCart();
    return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Obtiene el total del carrito en pesos
 */
export function getCartTotal(): number {
    const items = getCart();
    return items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
}

/**
 * Verifica si el carrito está vacío
 */
export function isCartEmpty(): boolean {
    return getCart().length === 0;
}
