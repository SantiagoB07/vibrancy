import { createClient } from "@/lib/supabase/server";
import { Package, Truck, Sparkles, Heart } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { GirasolCustom } from "@/components/girasol-custom";
import { PetCustom } from "@/components/pet-custom";
import { RelicarioCustom } from "@/components/relicario-custom";
import { RelicarioCircCustom } from "@/components/relicarioCirc-custom";
import { LetterCharmCustom } from "@/components/letter-charm-custom";
import { AnimatedSection } from "@/components/animated-section";
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

  if (nombre.includes("dije") && nombre.includes("carta")) {
    return (
        <LetterCharmCustom product={product}>
          <button className="w-full bg-amber-900 hover:bg-amber-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
            Personalizar
          </button>
        </LetterCharmCustom>
    );
  }

  // Default: link a página de producto
  return (
      <Link
          href={`/producto/${product.id}`}
          className="w-full bg-amber-900 hover:bg-amber-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center block"
      >
        Personalizar
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
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-amber-100 via-orange-100 to-amber-100 relative overflow-hidden">
          {/* Decorative triangles */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-20 left-10 w-32 h-32 border-2 border-amber-900"
                 style={{clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)'}}></div>
            <div className="absolute bottom-20 right-10 w-24 h-24 border-2 border-amber-900"
                 style={{clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)'}}></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 pb-16 md:pb-24 relative">
            <div className="text-center">
              {/* Logo con animación rotate in */}
              <div className="flex justify-center mb-6 animate-rotate-in">
                <img
                  src="/images/vibrancy-logo.png"
                  alt="Vibrancy"
                  className="h-32 md:h-40 lg:h-48 w-auto object-contain"
                />
              </div>

              {/* Título con fade in up */}
              <h1 
                  className="text-4xl md:text-5xl lg:text-6xl font-serif italic text-amber-900 mb-6 animate-fade-in-up"
                  style={{ animationDelay: '0.3s' }}
              >
                Vibrancy Accesorios
                <span className="block text-orange-700 mt-2 text-2xl md:text-3xl lg:text-4xl">Arte hecho con amor</span>
              </h1>

              {/* Botón con animación fade in up */}
              <a
                  href="#productos"
                  className="inline-flex items-center gap-2 bg-amber-900 hover:bg-amber-800 text-white font-semibold py-4 px-8 rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105 animate-fade-in-up"
                  style={{ animationDelay: '0.5s' }}
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
                      className="flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="bg-amber-100 p-2 rounded-lg">
                      <feature.icon className="h-5 w-5 text-amber-800" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-900 text-sm">{feature.title}</h3>
                      <p className="text-amber-700 text-xs">{feature.description}</p>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </section>
        

        {/* Products Section */}
        <section id="productos" className="py-16 bg-gradient-to-b from-amber-50 to-orange-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fade-up">
              <h2 className="text-2xl md:text-3xl font-serif italic text-amber-900 text-center mb-4">
                Nuestra Colección
              </h2>
              <p className="text-amber-800 text-center mb-12 max-w-2xl mx-auto">
                Todos nuestros productos son personalizables. Elige el tuyo y hazlo único.
              </p>
            </AnimatedSection>

            {(!products || products.length === 0) ? (
                <div className="text-center py-16">
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
            <AnimatedSection animation="fade-up">
              <h2 className="text-2xl md:text-3xl font-serif italic text-amber-900 text-center mb-12">
                ¿Por qué elegir Vibrancy?
              </h2>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature) => (
                  <div key={feature.title} className="text-center">
                    <div className="bg-amber-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                      <feature.icon className="h-8 w-8 text-amber-800" />
                    </div>
                    <h3 className="text-xl font-semibold text-amber-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-amber-700">{feature.description}</p>
                  </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-amber-900 to-orange-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <AnimatedSection animation="fade-up">
              <h2 className="text-2xl md:text-3xl font-serif italic text-white mb-4">
                ¿Tienes algo especial en mente?
              </h2>
              <p className="text-amber-200 mb-8">
                Contáctanos para diseños personalizados o pedidos especiales
              </p>
            </AnimatedSection>
            <AnimatedSection animation="scale-in" delay={0.2}>
              <a
                  href="https://wa.me/573001234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-amber-900 font-semibold py-4 px-8 rounded-full hover:bg-amber-50 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Escríbenos por WhatsApp
              </a>
            </AnimatedSection>
          </div>
        </section>
      </div>
  );
}