import { NextResponse } from "next/server";
import { generatePhrases, containsInappropriateContent, ProductType } from "@/lib/ai";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { productType, userContext, maxChars } = body;

        // Validaciones básicas
        if (!productType || !maxChars) {
            return NextResponse.json(
                { error: "Faltan parámetros requeridos" },
                { status: 400 }
            );
        }

        // Validar tipo de producto
        const validProductTypes: ProductType[] = [
            "relicario",
            "relicario-circular",
            "girasol",
            "letter-charm",
            "pet-tag"
        ];

        if (!validProductTypes.includes(productType)) {
            return NextResponse.json(
                { error: "Tipo de producto inválido" },
                { status: 400 }
            );
        }

        // Validar longitud del contexto
        const context = (userContext || "").trim();
        if (context.length > 200) {
            return NextResponse.json(
                { error: "El contexto es demasiado largo (máx. 200 caracteres)" },
                { status: 400 }
            );
        }

        // Filtro rápido de contenido inapropiado
        if (containsInappropriateContent(context)) {
            return NextResponse.json({
                valid: false,
                reason: "inappropriate",
                phrases: [],
                message: "Por favor usa un lenguaje apropiado."
            });
        }

        // Verificar API key
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.error("GROQ_API_KEY no está configurada");
            return NextResponse.json(
                { error: "Servicio de IA no disponible" },
                { status: 500 }
            );
        }

        // Generar frases
        const result = await generatePhrases(apiKey, {
            productType,
            userContext: context,
            maxChars: Number(maxChars),
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error("Error en /api/ai/suggest-phrases:", error);
        return NextResponse.json(
            { error: "Error al generar sugerencias" },
            { status: 500 }
        );
    }
}
