import { createClient } from "@/lib/supabase/server";
import { Package, Truck, Sparkles, Heart } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { GirasolCustom } from "@/components/girasol-custom";
import { PetCustom } from "@/components/pet-custom";
import { RelicarioCustom } from "@/components/relicario-custom";
import { RelicarioCircCustom } from "@/components/relicarioCirc-custom";
import Link from "next/link";

// Categorías hardcoded
const categories = [
  { name: "Llaveros", icon: "🔑", description: "Personaliza tu llavero" },
  { name: "Relicarios", icon: "💍", description: "Guarda tus recuerdos" },
  { name: "Placas Mascota", icon: "🐾", description: "Para tu mejor amigo" },
  { name: "Dijes", icon: "✨", description: "Accesorios únicos" },
];

export const revalidate = 60;
// Features/beneficios
const features = [
  {
    icon: Sparkles,
    title: "Personalizado",
    description: "Cada pieza es única, diseñada especialmente para ti",
  },
  {
    icon: Truck,
    title: "Envío Nacional",
    description: "Enviamos a toda Colombia con seguimiento",
  },
  {
    icon: Heart,
    title: "Calidad Premium",
    description: "Materiales de alta calidad que perduran",
  },
];

interface Product {
  id: string;
  title: string;
  price: number;
  img?: string;
  status?: boolean;
}

// Helper para determinar qué modal usar según el nombre del producto
function getProductModal(product: Product) {
  const nombre = product.title?.toLowerCase() || "";
  
  if (nombre.includes("llavero")) {
    return (
      <Link
        href="/personalizar-llavero"
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center block"
      >
        Personalizar
      </Link>
    );
  }
  
  if (nombre.includes("corazón") || nombre.includes("corazon")) {
    return (
      <RelicarioCustom product={product}>
        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
          Personalizar
        </button>
      </RelicarioCustom>
    );
  }
  
  if (nombre.includes("girasol")) {
    return (
      <GirasolCustom product={product}>
        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
          Personalizar
        </button>
      </GirasolCustom>
    );
  }
  
  if (nombre.includes("placa") && nombre.includes("mascota")) {
    return (
      <PetCustom product={product}>
        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
          Personalizar
        </button>
      </PetCustom>
    );
  }
  
  if (nombre.includes("relicario")) {
    return (
      <RelicarioCircCustom product={product}>
        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
          Personalizar
        </button>
      </RelicarioCircCustom>
    );
  }
  
  // Default: link a página de producto
  return (
    <Link
      href={`/producto/${product.id}`}
      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center block"
    >
      Ver Producto
    </Link>
  );
}

export default async function Home() {
  const supabase = await createClient();

  let products: Product[] = [];
  let loadError: string | null = null;

  try {
    const { data, error } = await supabase
        .from("products")
        .select("id, title, price, img, status")
        .eq("status", true)
        .order("created_at", { ascending: false })
        .limit(50);

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
              Accesorios Personalizados
              <span className="block text-orange-500">con Significado</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Llaveros, relicarios, placas de mascota y dijes únicos. 
              Cada pieza cuenta tu historia.
            </p>
            <a
              href="#productos"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-8 rounded-full transition-colors shadow-lg hover:shadow-xl"
            >
              Ver Colección
              <span>↓</span>
            </a>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm"
              >
                <div className="bg-orange-100 p-2 rounded-lg">
                  <feature.icon className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{feature.title}</h3>
                  <p className="text-gray-500 text-xs">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8">
            Compra por Categoría
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div
                key={category.name}
                className="bg-gray-50 hover:bg-orange-50 border-2 border-gray-100 hover:border-orange-200 rounded-2xl p-6 text-center transition-all duration-300 cursor-pointer group"
              >
                <span className="text-4xl mb-3 block group-hover:scale-110 transition-transform">
                  {category.icon}
                </span>
                <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="productos" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
            Nuestra Colección
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Todos nuestros productos son personalizables. Elige el tuyo y hazlo único.
          </p>

          {(!products || products.length === 0) ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Próximamente
              </h3>
              <p className="text-gray-600">
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
      </section>

      {/* Why Vibrancy Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
            ¿Por qué elegir Vibrancy?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-amber-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            ¿Tienes algo especial en mente?
          </h2>
          <p className="text-orange-100 mb-8">
            Contáctanos para diseños personalizados o pedidos especiales
          </p>
          <a
            href="https://wa.me/573001234567"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-orange-600 font-semibold py-4 px-8 rounded-full hover:bg-orange-50 transition-colors shadow-lg"
          >
            Escríbenos por WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
