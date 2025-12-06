import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductClient from "./ProductClient";

export default async function ProductoPage(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params;

    const supabase = await createClient();

    const { data: producto, error } = await supabase
        .from("products")
        .select("id, title, description, price, img, status")
        .eq("id", id)
        .single();

    if (error || !producto) {
        console.error(error);
        notFound();
    }

    const { data: relacionados } = await supabase
        .from("products")
        .select("id, title, description, price, img")
        .neq("id", id)
        .order("created_at", { ascending: false })
        .limit(3);

    return <ProductClient producto={producto} relacionados={relacionados ?? []} />;
}
