import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductClient from "./ProductClient";

export default async function ProductoPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();

    const { data: producto, error } = await supabase
        .from("products")
        .select("id, title, description, price, img, status")
        .eq("id", params.id)
        .single();

    if (error || !producto) {
        console.error(error);
        notFound();
    }

    // Productos relacionados
    const { data: relacionados } = await supabase
        .from("products")
        .select("id, title, price, img")
        .neq("id", params.id)
        .order("created_at", { ascending: false })
        .limit(3);

    return <ProductClient producto={producto} relacionados={relacionados ?? []} />;
}
