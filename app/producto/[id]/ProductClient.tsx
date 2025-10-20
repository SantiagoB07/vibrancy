"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import { formatCOP } from "@/lib/utils";
import { useRouter } from "next/navigation";

function imgUrl(img?: string) {
    if (!img) return "/images/04.png";
    if (img.startsWith("http")) return img;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
        console.warn("NEXT_PUBLIC_SUPABASE_URL not configured, using placeholder");
        return "/images/04.png";
    }

    return `${supabaseUrl}/storage/v1/object/public/product-images/${img}`;
}

interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    img?: string;
}

interface ProductClientProps {
    producto: Product;
    relacionados: Product[];
}

export default function ProductClient({ producto, relacionados }: ProductClientProps) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState<number | null>(null);
    const router = useRouter();

    const handleBuyNow = () => {
        // Normaliza el título a minúsculas para evitar errores
        const nombre = producto.title.toLowerCase();

        if (nombre.includes("llavero")) {
            // Si es un llavero → redirige
            router.push("/personalizar-llavero");
        } else {
            // Si no es llavero → no hace nada
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full bg-white shadow-xl rounded-2xl overflow-hidden">
                {/* Imagen */}
                <div className="bg-gray-100 flex items-center justify-center">
                    <img
                        src={imgUrl(producto.img)}
                        alt={producto.title}
                        className="object-cover h-96 w-full"
                    />
                </div>

                {/* Detalles */}
                <div className="p-6 flex flex-col justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-4 text-black">{producto.title}</h1>
                        <p className="text-gray-600 mb-6">{producto.description}</p>

                        {/* Sistema de Calificación */}
                        <div className="flex items-center gap-2 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(null)}
                                >
                                    <Star
                                        className={`h-6 w-6 transition-colors ${
                                            (hover ?? rating) >= star
                                                ? "text-yellow-400 fill-yellow-400"
                                                : "text-gray-300"
                                        }`}
                                    />
                                </button>
                            ))}
                            <span className="ml-2 text-sm text-gray-500">
                {rating > 0 ? `${rating} / 5` : "Sin calificación"}
              </span>
                        </div>

                        <p className="text-3xl font-semibold text-green-600">
                            {formatCOP(producto.price ?? 0)}
                        </p>
                    </div>

                    <button
                        onClick={handleBuyNow}
                        className="mt-6 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
                    >
                        Comprar ahora
                    </button>
                </div>
            </div>

            {/* Productos relacionados */}
            <div className="mt-12 max-w-6xl mx-auto w-full">
                <h2 className="text-2xl font-bold mb-4">Productos relacionados</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {relacionados.length > 0 ? (
                        relacionados.map((rel) => (
                            <div
                                key={rel.id}
                                className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition"
                            >
                                <img
                                    src={imgUrl(rel.img)}
                                    alt={rel.title}
                                    className="rounded mb-3 object-cover h-40 w-full"
                                />
                                <h3 className="font-semibold text-black">{rel.title}</h3>
                                <p className="text-sm text-gray-500">
                                    {formatCOP(rel.price ?? 0)}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No hay productos relacionados</p>
                    )}
                </div>
            </div>
        </div>
    );
}
