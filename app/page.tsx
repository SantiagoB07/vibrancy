import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils";
import { ProductModal } from "@/components/product-modal";

function imgUrl(img?: string) {
    if (!img) return "/images/04.png";
    if (img.startsWith("http")) return img;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${img}`;
}

export default async function Home() {
    const supabase = await createClient();

    const { data: products, error } = await supabase
        .from("products")
        .select("id, title, price, img, status")
        .eq("status", true)
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error(error);
        return <p>Error cargando productos: {error.message}</p>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
            {/* Hero Section */}
            <div className="bg-white shadow-sm border-b border-amber-100">
                <div className="max-w-7xl mx-auto px-6 py-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-amber-900 mb-4">
                        Bienvenido a Vibrancy
                    </h1>
                    <p className="text-lg text-amber-700 max-w-2xl mx-auto">
                        Explora nuestra colección de productos exclusivos. 
                        Elegancia y estilo en cada detalle.
                    </p>
                </div>
            </div>

            {/* Products Grid */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                {(!products || products.length === 0) ? (
                    <div className="text-center py-16">
                        <h3 className="text-xl font-semibold text-amber-900 mb-2">
                            Próximamente
                        </h3>
                        <p className="text-amber-700">
                            Estamos preparando nuevos productos exclusivos para ti.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {products.map((p) => (
                            <ProductModal
                                key={p.id}
                                product={p}
                            >
                                <div className="group cursor-pointer">
                                    <div className="bg-white rounded-2xl shadow hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:-translate-y-1">
                                        <div className="relative">
                                            <img
                                                src={imgUrl(p.img)}
                                                alt={p.title ?? "Producto"}
                                                className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        </div>
                                        <div className="p-6">
                                            <h2 className="text-lg font-semibold text-amber-900 mb-2 group-hover:text-amber-700 transition-colors">
                                                {p.title}
                                            </h2>
                                            <p className="text-xl font-bold text-orange-600">
                                                {formatCOP(p.price ?? 0)}
                                            </p>
                                            <span className="mt-3 inline-block text-sm text-amber-600 group-hover:underline">
                                                Ver detalle →
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </ProductModal>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

