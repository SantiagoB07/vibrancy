"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Lightbulb, Loader2, RefreshCw, X, AlertCircle } from "lucide-react";
import { ProductType } from "@/lib/ai";

interface AIPhraseModalProps {
    productType: ProductType;
    maxChars: number;
    onSelectPhrase: (phrase: string) => void;
    children?: React.ReactNode;
}

interface SuggestResponse {
    valid: boolean;
    reason?: "unrelated" | "inappropriate" | "nonsense";
    phrases: string[];
    message?: string;
    error?: string;
}

const errorMessages: Record<string, string> = {
    unrelated: "No pudimos entender tu descripcion. Intenta algo como: \"amor a mi mama\", \"mi perro Max\", \"aniversario\"",
    inappropriate: "Por favor usa un lenguaje apropiado.",
    nonsense: "No pudimos generar frases con esa descripcion. Intenta ser mas especifico.",
};

export function AIPhraseModal({ productType, maxChars, onSelectPhrase }: AIPhraseModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [userContext, setUserContext] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [phrases, setPhrases] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(false);

    const handleGenerate = async () => {
        if (cooldown) return;

        setIsLoading(true);
        setError(null);
        setPhrases([]);
        setCooldown(true);

        try {
            const res = await fetch("/api/ai/suggest-phrases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productType,
                    userContext: userContext.trim(),
                    maxChars,
                }),
            });

            const data: SuggestResponse = await res.json();

            if (!res.ok) {
                setError(data.error || "Error al generar sugerencias. Intenta de nuevo.");
                return;
            }

            if (!data.valid) {
                const reason = data.reason || "unrelated";
                setError(data.message || errorMessages[reason] || errorMessages.unrelated);
                return;
            }

            if (data.phrases && data.phrases.length > 0) {
                setPhrases(data.phrases);
            } else {
                setError("No se generaron frases. Intenta con otra descripcion.");
            }
        } catch (err) {
            console.error("Error en AIPhraseModal:", err);
            setError("Error de conexion. Intenta de nuevo.");
        } finally {
            setIsLoading(false);
            setTimeout(() => setCooldown(false), 3000);
        }
    };

    const handleSelectPhrase = (phrase: string) => {
        onSelectPhrase(phrase);
        setIsOpen(false);
        setPhrases([]);
        setUserContext("");
        setError(null);
    };

    const handleClose = () => {
        setIsOpen(false);
        setPhrases([]);
        setUserContext("");
        setError(null);
    };

    return (
        <>
            {/* Trigger button - Estilo Vibrancy */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-800 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
            >
                <Lightbulb className="w-4 h-4" />
                <span>Ideas</span>
            </button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border-amber-200">
                    {/* Header - Estilo Vibrancy */}
                    <div className="bg-amber-900 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white">
                                <Lightbulb className="w-5 h-5" />
                                <DialogTitle className="text-lg font-semibold text-white">
                                    Ideas de frase
                                </DialogTitle>
                            </div>
                            <button
                                onClick={handleClose}
                                className="text-amber-200 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-amber-200 text-sm mt-1">
                            Te ayudamos a encontrar la frase perfecta
                        </p>
                    </div>

                    <div className="p-5 space-y-4 bg-amber-50/30">
                        {/* Estado inicial o con error: mostrar input */}
                        {phrases.length === 0 && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-amber-900 mb-2">
                                        Describe para quien o que ocasion es
                                    </label>
                                    <input
                                        type="text"
                                        value={userContext}
                                        onChange={(e) => setUserContext(e.target.value.slice(0, 200))}
                                        placeholder='Ej: "regalo para mama", "mi perro Luna"'
                                        className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm bg-white"
                                        maxLength={200}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !isLoading && !cooldown) {
                                                handleGenerate();
                                            }
                                        }}
                                    />
                                    <p className="text-xs text-amber-600 mt-1.5">
                                        Puedes dejarlo vacio para frases genericas
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-100 p-3 rounded-xl">
                                    <span>Limite para este accesorio:</span>
                                    <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                                        {maxChars} caracteres
                                    </span>
                                </div>

                                {/* Error message */}
                                {error && (
                                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleGenerate}
                                    disabled={isLoading || cooldown}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-900 hover:bg-amber-800 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Generando ideas...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Lightbulb className="w-5 h-5" />
                                            <span>Generar ideas</span>
                                        </>
                                    )}
                                </button>

                                {isLoading && (
                                    <p className="text-center text-xs text-amber-600">
                                        Creando frases unicas para tu accesorio...
                                    </p>
                                )}
                            </>
                        )}

                        {/* Resultados */}
                        {phrases.length > 0 && (
                            <>
                                <div>
                                    <p className="text-sm font-medium text-amber-900 mb-3">
                                        Selecciona una frase:
                                    </p>
                                    <div className="space-y-2">
                                        {phrases.map((phrase, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleSelectPhrase(phrase)}
                                                className="w-full text-left p-4 bg-white hover:bg-amber-50 border border-amber-200 hover:border-amber-400 rounded-xl transition-all group"
                                            >
                                                <p className="text-sm font-medium text-amber-900 group-hover:text-amber-800">
                                                    &quot;{phrase}&quot;
                                                </p>
                                                <p className={`text-xs mt-1 ${phrase.length <= maxChars ? "text-green-600" : "text-red-600"}`}>
                                                    {phrase.length}/{maxChars} caracteres
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-amber-200">
                                    <p className="text-xs text-amber-500">
                                        Generado con IA
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setPhrases([]);
                                                setError(null);
                                            }}
                                            disabled={isLoading || cooldown}
                                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${cooldown ? "animate-spin" : ""}`} />
                                            Otras ideas
                                        </button>
                                        <button
                                            onClick={handleClose}
                                            className="px-3 py-2 text-sm text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
