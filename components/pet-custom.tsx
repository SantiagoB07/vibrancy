'use client';

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { X, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

interface PetCustomProps {
    product: {
        id: string;
        title: string;
        price: number;
        img?: string;
    };
    children: React.ReactNode;
}

export function PetCustom({ product, children }: PetCustomProps) {
    const [isOpen, setIsOpen] = useState(false);

    const [petName, setPetName] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("petTag_petName") || "";
        }
        return "";
    });

    const [ownerInfo, setOwnerInfo] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("petTag_ownerInfo") || "";
        }
        return "";
    });

    const [currentFace, setCurrentFace] = useState(1);
    const [isRotating, setIsRotating] = useState(false);
    const [isPaying, setIsPaying] = useState(false); // para deshabilitar botón mientras redirige

    // Constraints
    const MAX_PER_LINE = 15;
    const MAX_LINES = 2;

    function clampMultiline(value: string) {
        const lines = value.split(/\r?\n/).slice(0, MAX_LINES);
        const trimmed = lines.map((l) => l.slice(0, MAX_PER_LINE));
        return trimmed.join("\n");
    }

    const currentValue = currentFace === 1 ? petName : ownerInfo;
    const currentLines = useMemo(
        () => currentValue.split(/\r?\n/),
        [currentValue]
    );

    // ====== HEADER: nf, total, handlePay ======
    const nf = new Intl.NumberFormat("es-CO");
    const total = product.price;

    const handlePay = async () => {
        try {
            setIsPaying(true);

            const customerId = null;

            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerId,
                    items: [
                        {
                            productId: Number(product.id),
                            productVariantId: null,
                            quantity: 1,
                            unitPrice: product.price,
                            title: product.title,
                            personalizationFront: petName,
                            personalizationBack: ownerInfo,
                        },
                    ],
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                console.error("Error desde /api/checkout:", data);
                alert(data.error || "No se pudo iniciar el pago.");
                return;
            }

            if (!data.init_point) {
                console.error("Respuesta sin init_point:", data);
                alert("No se recibió la URL de pago.");
                return;
            }

            console.log("Order creada con id:", data.order_id);
            window.location.href = data.init_point;
        } catch (error) {
            console.error("Error en handlePay:", error);
            alert("Error al conectar con Mercado Pago.");
        } finally {
            setIsPaying(false);
        }
    };

    // =========================================

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl w-full max-h-[90vh] p-0 bg-transparent border-none">
                <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                    {/* botón cerrar */}
                    <div className="absolute right-4 top-4 z-10">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
                        >
                            <X className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>

                    {/* HEADER DEL MODAL */}
                    <div className="bg-white border-b">
                        <div className="px-4 md:px-6 py-3 md:py-4 pr-12 md:pr-16">
                            {/* Mobile: stack vertical, Desktop: horizontal */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                                <h1 className="text-base md:text-xl font-bold text-zinc-900">
                                    Personaliza tu placa
                                </h1>
                                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                                    <div className="text-left sm:text-right">
                                        <div className="text-xs text-zinc-600">Total</div>
                                        <div className="text-base md:text-2xl font-bold text-zinc-900">
                                            ${" "}{nf.format(total)}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handlePay}
                                        disabled={isPaying}
                                        className="bg-black text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-medium hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition text-sm md:text-base"
                                    >
                                        {isPaying ? "Redirigiendo..." : "Pagar ahora"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CONTENIDO DEL MODAL (CON SCROLL) */}
                    <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-10 pt-6">
                        {/* Pet Tag Preview */}
                        <div className="flex justify-center mb-6 md:mb-8">
                            <div className="relative">
                                {/* Bone-shaped Pet Tag IMAGE */}
                                <div
                                    className="relative w-48 md:w-72 transition-transform duration-500"
                                    style={{
                                        transform:
                                            currentFace === 2 ? "rotateY(180deg)" : "rotateY(0deg)",
                                        transformStyle: "preserve-3d",
                                    }}
                                >
                                    <img
                                        src="/images/pet-tag-removebg-preview.png"
                                        alt="Placa para mascota en forma de hueso"
                                        className="block w-48 md:w-72 h-auto select-none pointer-events-none drop-shadow"
                                    />

                                    {/* Text overlay */}
                                    <div
                                        className="absolute inset-0 flex items-center justify-center px-6 md:px-10 text-center"
                                        style={{
                                            opacity: isRotating ? 0 : 1,
                                            transition: "opacity 0.1s ease-in-out",
                                            transform:
                                                currentFace === 2 ? "scaleX(-1)" : "scaleX(1)",
                                        }}
                                    >
                                        <div
                                            className="font-bold text-gray-900 tracking-wide"
                                            style={{
                                                WebkitFontSmoothing: "antialiased",
                                                MozOsxFontSmoothing: "grayscale",
                                                textRendering: "optimizeLegibility",
                                                letterSpacing: "0.2px",
                                                fontSize:
                                                    currentLines.length > 1
                                                        ? "clamp(9px, 4vw, 18px)"
                                                        : "clamp(11px, 5vw, 22px)",
                                                lineHeight: 1.1,
                                                whiteSpace: "pre-wrap",
                                                wordBreak: "break-word",
                                                maxWidth: "100%",
                                            }}
                                        >
                                            {currentFace === 1 ? petName : ownerInfo}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Face Switch Button */}
                        <div className="flex justify-center mb-4 md:mb-6">
                            <button
                                onClick={() => {
                                    setIsRotating(true);
                                    setCurrentFace(currentFace === 1 ? 2 : 1);
                                    setTimeout(() => setIsRotating(false), 500);
                                }}
                                className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                            >
                                <RotateCcw className="h-4 w-4" />
                                <span className="text-xs md:text-sm font-medium">
                                    {currentFace === 1 ? "Ver cara 2" : "Ver cara 1"}
                                </span>
                            </button>
                        </div>

                        {/* Customization Input */}
                        <div className="space-y-4">
                            <div>
                                <textarea
                                    value={currentValue}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            const lines = currentValue.split(/\r?\n/);
                                            if (lines.length >= MAX_LINES) {
                                                e.preventDefault();
                                            }
                                        }
                                    }}
                                    onChange={(e) => {
                                        const clamped = clampMultiline(e.target.value);
                                        if (currentFace === 1) {
                                            setPetName(clamped);
                                            if (typeof window !== "undefined") {
                                                localStorage.setItem("petTag_petName", clamped);
                                            }
                                        } else {
                                            setOwnerInfo(clamped);
                                            if (typeof window !== "undefined") {
                                                localStorage.setItem("petTag_ownerInfo", clamped);
                                            }
                                        }
                                    }}
                                    placeholder="Personaliza tu placa (Enter para nueva línea)"
                                    rows={Math.min(
                                        MAX_LINES,
                                        Math.max(1, currentLines.length)
                                    )}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-sm font-semibold tracking-wide resize-none"
                                />
                                <div className="mt-1 text-center text-xs text-gray-500">
                                    {currentLines.map((l, i) => (
                                        <div key={i}>{`L${i + 1}: ${l.length}/${MAX_PER_LINE} caracteres`}</div>
                                    ))}
                                    {currentLines.length < MAX_LINES && (
                                        <div>{`Puedes añadir otra línea (máx. ${MAX_LINES}).`}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
