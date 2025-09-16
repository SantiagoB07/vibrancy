import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils";

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
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return <p>Error cargando productos: {error.message}</p>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Bienvenido a Vibrancy</h1>
            <p className="mb-6">Explora nuestra colección de productos exclusivos.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products?.map((p) => (
                    <div
                        key={p.id}
                        className="border rounded-lg p-4 shadow hover:shadow-md transition"
                    >
                        <img
                            src={imgUrl(p.img)}
                            alt={p.title ?? "Producto"}
                            className="w-full h-40 object-cover mb-3 rounded"
                        />
                        <h2 className="text-lg font-semibold">{p.title}</h2>
                        <p className="text-gray-600">{formatCOP(p.price ?? 0)}</p>
                        <Link
                            href={`/producto/${p.id}`}
                            prefetch={true}
                            className="mt-3 inline-block text-sm text-blue-600 hover:underline"
                        >
                            Ver detalle
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
