// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface RouteContext {
    params: { id: string };
}

export async function GET(req: NextRequest, context: RouteContext) {
    const { id } = context.params;
    const orderId = Number(id);

    if (!orderId || Number.isNaN(orderId)) {
        return NextResponse.json(
            { error: "Invalid order id" },

        );
    }

    const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

    if (error) {
        console.error("❌ Error consultando orden:", error);
        return NextResponse.json(
            { error: "DB error" },

        );
    }

    if (!order) {
        return NextResponse.json(
            { error: "Order not found" },

        );
    }

    return NextResponse.json({ order }, );
}

