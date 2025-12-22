import Groq from "groq-sdk";

// Tipos
export type ProductType = "relicario" | "relicario-circular" | "girasol" | "letter-charm" | "pet-tag";

export interface SuggestPhrasesRequest {
    productType: ProductType;
    userContext: string;
    maxChars: number;
}

export interface SuggestPhrasesResponse {
    valid: boolean;
    reason?: "unrelated" | "inappropriate" | "nonsense";
    phrases: string[];
}

// Descripciones de productos para el prompt
const productDescriptions: Record<ProductType, string> = {
    "relicario": "un relicario en forma de corazón para guardar fotos de seres queridos",
    "relicario-circular": "un relicario circular elegante para guardar fotos de seres queridos",
    "girasol": "un dije de girasol que se abre y revela un mensaje especial, ideal para regalar a mamá o seres queridos",
    "letter-charm": "un dije en forma de carta/sobre que contiene un mensaje secreto de amor",
    "pet-tag": "una placa identificadora para mascotas con el nombre y datos del dueño",
};

// Lista de palabras inapropiadas (básica)
const inappropriateWords = [
    "idiota", "estupido", "mierda", "puta", "puto", "verga", "culo",
    "pendejo", "cabron", "chingar", "joder", "coño", "fuck", "shit",
    "bitch", "ass", "dick", "pussy", "damn", "bastard"
];

/**
 * Verifica si el texto contiene palabras inapropiadas
 */
export function containsInappropriateContent(text: string): boolean {
    const lowerText = text.toLowerCase();
    return inappropriateWords.some(word => lowerText.includes(word));
}

/**
 * Genera frases usando Groq AI (Llama 3.3)
 */
export async function generatePhrases(
    apiKey: string,
    request: SuggestPhrasesRequest
): Promise<SuggestPhrasesResponse> {
    const { productType, userContext, maxChars } = request;

    // Validación de contenido inapropiado en frontend
    if (containsInappropriateContent(userContext)) {
        return {
            valid: false,
            reason: "inappropriate",
            phrases: [],
        };
    }

    const groq = new Groq({ apiKey });
    const productDesc = productDescriptions[productType];

    const systemPrompt = `Eres un asistente creativo que genera frases cortas y emotivas para grabar en accesorios personalizados.

CONTEXTO DEL PRODUCTO:
- Tipo: ${productDesc}
- Límite ESTRICTO: ${maxChars} caracteres por frase (incluyendo espacios)

REGLAS IMPORTANTES:
1. Genera EXACTAMENTE 3 frases únicas y emotivas
2. Cada frase DEBE tener ${maxChars} caracteres o menos
3. Las frases pueden ser en español o inglés según el contexto del usuario
4. Si el contexto del usuario no tiene sentido, es irrelevante para un accesorio personalizado, o está vacío, responde con valid: false
5. NO incluyas comillas ni puntuación innecesaria en las frases
6. Las frases deben ser apropiadas para grabar en joyería

EJEMPLOS DE CONTEXTOS VÁLIDOS:
- "amor a mi mamá" → válido
- "mi perro Max" → válido
- "aniversario 10 años" → válido
- "regalo para abuela" → válido

EJEMPLOS DE CONTEXTOS INVÁLIDOS:
- "qwerty asdf" → inválido (sin sentido)
- "cuanto es 2+2" → inválido (no relacionado)
- "hola como estas" → inválido (no es contexto para accesorio)

FORMATO DE RESPUESTA (JSON únicamente, sin markdown ni texto adicional):
Si el contexto es válido:
{"valid": true, "phrases": ["frase1", "frase2", "frase3"]}

Si el contexto es inválido o vacío:
{"valid": false, "reason": "unrelated", "phrases": []}

Razones posibles: "unrelated" (no relacionado), "nonsense" (sin sentido)`;

    const userPrompt = userContext.trim() 
        ? `Contexto del usuario: "${userContext}"\n\nGenera 3 frases para este accesorio.`
        : `El usuario no proporcionó contexto. Responde con valid: false y reason: "unrelated".`;

    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 256,
        });

        const text = completion.choices[0]?.message?.content || "";

        // Extraer JSON de la respuesta
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("No se encontró JSON en la respuesta:", text);
            return {
                valid: false,
                reason: "nonsense",
                phrases: [],
            };
        }

        const parsed = JSON.parse(jsonMatch[0]) as SuggestPhrasesResponse;

        // Validar y truncar frases si exceden el límite
        if (parsed.valid && parsed.phrases) {
            parsed.phrases = parsed.phrases
                .map(phrase => phrase.trim())
                .filter(phrase => phrase.length > 0)
                .map(phrase => phrase.length > maxChars ? phrase.substring(0, maxChars) : phrase)
                .slice(0, 3);
        }

        return parsed;
    } catch (error) {
        console.error("Error generando frases con Groq:", error);
        throw error;
    }
}
