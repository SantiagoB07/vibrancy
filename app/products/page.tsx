import { createClient } from "@/lib/supabase/server";
import { Package } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { GirasolCustom } from "@/components/girasol-custom";
import { PetCustom } from "@/components/pet-custom";
import { RelicarioCustom } from "@/components/relicario-custom";
import { RelicarioCircCustom } from "@/components/relicarioCirc-custom";
import Link from "next/link";

interface Product {
  id: string;
  title: string;
  price: number;
  img?: string;
  status?: boolean;
}

export const revalidate = 60;

// Helper para determinar qué modal usar según el nombre del producto
function getProductModal(product: Product) {
  const nombre = product.title?.toLowerCase() || "";

  if (nombre.includes("llavero")) {
    return (
        <Link
            href="/personalizar-llavero"
            className="w-full bg-amber-900 hover:bg-amber-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center block"
        >
          Personalizar
        </Link>
    );
  }

  if (nombre.includes("corazón") || nombre.includes("corazon")) {
    return (
        <RelicarioCustom product={product}>
          <button className="w-full bg-amber-900 hover:bg-amber-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
            Personalizar
          </button>
        </RelicarioCustom>
    );
  }

  if (nombre.includes("girasol")) {
    return (
        <GirasolCustom product={product}>
          <button className="w-full bg-amber-900 hover:bg-amber-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
            Personalizar
          </button>
        </GirasolCustom>
    );
  }

  if (nombre.includes("placa") && nombre.includes("mascota")) {
    return (
        <PetCustom product={product}>
          <button className="w-full bg-amber-900 hover:bg-amber-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
            Personalizar
          </button>
        </PetCustom>
    );
  }

  if (nombre.includes("relicario")) {
    return (
        <RelicarioCircCustom product={product}>
          <button className="w-full bg-amber-900 hover:bg-amber-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
            Personalizar
          </button>
        </RelicarioCircCustom>
    );
  }

  // Default: link a página de producto
  return (
      <Link
          href={`/producto/${product.id}`}
          className="w-full bg-amber-900 hover:bg-amber-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center block"
      >
        Ver Producto
      </Link>
  );
}

export default async function ProductsPage() {
  const supabase = await createClient();

  let products: Product[] = [];
  let loadError: string | null = null;

  try {
    const { data, error } = await supabase
        .from("products")
        .select("id, title, price, img, status")
        .eq("status", true)
        .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando productos desde Supabase:", error);
      loadError = "No pudimos cargar los productos en este momento.";
    } else {
      products = data ?? [];
    }
  } catch (err) {
    console.error("Error de red al llamar a Supabase:", err);
    loadError = "Problema de conexión al cargar los productos.";
  }

  return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif italic font-bold text-amber-900 mb-4">
                Nuestra Colección
              </h1>
              <p className="text-lg text-amber-800 max-w-2xl mx-auto">
                Explora todos nuestros productos personalizables.
                Cada pieza es única y está hecha especialmente para ti.
              </p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {(!products || products.length === 0) ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <Package className="h-16 w-16 text-amber-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-amber-900 mb-2">
                  Próximamente
                </h3>
                <p className="text-amber-700">
                  Estamos preparando nuevos productos exclusivos para ti.
                </p>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {products.map((product, index) => (
                    <div
                        key={product.id}
                        className={`${
                            // Si es el último producto y hay número impar, centrarlo
                            products.length % 2 !== 0 && index === products.length - 1
                                ? "md:col-span-2 md:max-w-md md:mx-auto"
                                : ""
                        }`}
                    >
                      <ProductCard product={product}>
                        {getProductModal(product)}
                      </ProductCard>
                    </div>
                ))}
              </div>
          )}
        </div>
      </div>
  );
}