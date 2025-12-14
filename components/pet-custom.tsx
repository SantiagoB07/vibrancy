"use client";


import { Dialog, DialogContent, DialogTrigger, DialogTitle, VisuallyHidden } from "@/components/ui/dialog";
import { X, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { CustomerForm, CustomerData } from "@/components/checkout/CustomerForm";
import { Cookie, Courgette } from "next/font/google";


interface PetCustomProps {
    product: {
        id: string;
        title: string;
        price: number;
        img?: string;
    };
    children: React.ReactNode;
}

const cookie = Cookie({ subsets: ["latin"], weight: "400" });
const courgette = Courgette({ subsets: ["latin"], weight: "400" });

export function PetCustom({ product, children }: PetCustomProps) {
    const [isOpen, setIsOpen] = useState(false);

    const [petName, setPetName] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("petTag_petName") || "";
        }
        return "";
    });

    const [fontFamily, setFontFamily] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("petTag_fontFamily") || cookie.style.fontFamily;
        }
        return cookie.style.fontFamily;
    });

    const isCookie = fontFamily === cookie.style.fontFamily;


    const [ownerInfo, setOwnerInfo] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("petTag_ownerInfo") || "";
        }
        return "";
    });

    const [currentFace, setCurrentFace] = useState(1);
    const [isRotating, setIsRotating] = useState(false);


    // ====== flujo checkout (igual que relicario/girasol) ======
    const [step, setStep] = useState<1 | 2>(1);
    const [isPaying, setIsPaying] = useState(false);
    const [customerData, setCustomerData] = useState<CustomerData>({
        name: "",
        phone: "",
        email: "",
        address: "",
        neighborhood: "",
        locality: "",
    });

    const isCustomerFormValid =
        customerData.name.trim().length > 2 &&
        customerData.phone.trim().length >= 7 &&
        customerData.address.trim().length > 5 &&
        customerData.locality.trim().length > 2;

    // Constraints de texto en la placa
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

    const nf = new Intl.NumberFormat("es-CO");
    const total = product.price;

    const handlePay = async () => {
        if (!isCustomerFormValid) {
            alert("Por favor completa tus datos de envío.");
            return;
        }
        const getSelectedFontForDb = () => {
            if (fontFamily === cookie.style.fontFamily) {
                return "COOKIE";
            }
            if (fontFamily === courgette.style.fontFamily) {
                return "COURGETTE";
            }
            if (fontFamily === "Georgia, 'Times New Roman', serif") {
                return "GEORGIA";
            }
            if (fontFamily === "'Lucida Calligraphy', 'Lucida Handwriting', cursive") {
                return "LUCIDA_CALLIGRAPHY";
            }

            // Por si en el futuro agregas más opciones y se te olvida actualizar aquí
            return "UNKNOWN";
        };


        try {
            setIsPaying(true);

            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerData: {
                        name: customerData.name,
                        phone: customerData.phone,
                        email: customerData.email || null,
                        address: customerData.address,
                        neighborhood: customerData.neighborhood || null,
                        locality: customerData.locality || null,
                    },
                    items: [
                        {
                            productId: Number(product.id),
                            productVariantId: null,
                            quantity: 1,
                            unitPrice: product.price,
                            title: product.title,
                            personalizationFront: petName || null,
                            personalizationBack: ownerInfo || null,
                            engravingFont: getSelectedFontForDb()
                        },
                    ],


                }),
            });

            const data = await res.json();

            if (!res.ok) {
                console.error("Error desde /api/checkout (pet tag):", data);
                alert(data.error || "No se pudo iniciar el pago.");
                return;
            }

            if (!data.order_id || !data.access_token) {
                console.error("Respuesta sin order_id o access_token (pet tag):", data);
                alert("No se pudo crear la orden.");
                return;
            }

            // Redirigir a la página de selección de método de pago
            const params = new URLSearchParams({
                order_id: String(data.order_id),
                token: data.access_token,
                ...(data.init_point && { init_point: data.init_point }),
            });
            window.location.href = `/checkout/payment-method?${params}`;
        } catch (error) {
            console.error("Error en handlePay (pet tag):", error);
            alert("Error al procesar tu pedido.");
        } finally {
            setIsPaying(false);
        }
    };

    // =========================================

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>

<DialogContent className="sm:max-w-2xl w-full max-h-[90vh] p-0 bg-transparent border-none">
                <VisuallyHidden>
                    <DialogTitle>Personaliza tu placa para mascota</DialogTitle>
                </VisuallyHidden>
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
                                    {step === 1
                                        ? "Personaliza tu placa"
                                        : "Completa tus datos de envío"}
                                </h1>
                                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                                    <div className="text-left sm:text-right">
                                        <div className="text-xs text-zinc-600">Total</div>
                                        <div className="text-base md:text-2xl font-bold text-zinc-900">
                                            ${" "}
                                            {nf.format(total)}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (step === 1) {
                                                setStep(2);
                                                return;
                                            }
                                            handlePay();
                                        }}
                                        disabled={
                                            step === 2 && (!isCustomerFormValid || isPaying)
                                        }
                                        className="bg-black text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-medium hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition text-sm md:text-base"
                                    >
                                        {step === 1
                                            ? "Continuar"
                                            : isPaying
                                                ? "Procesando..."
                                                : "Continuar al pago"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CONTENIDO DEL MODAL (CON SCROLL) */}
                    <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-10 pt-6">
                        {step === 1 && (
                            <>
                                {/* Pet Tag Preview */}
                                <div className="flex justify-center mb-6 md:mb-8">
                                    <div className="relative">
                                        {/* Bone-shaped Pet Tag IMAGE */}
                                        <div
                                            className="relative w-48 md:w-72 transition-transform duration-500"
                                            style={{
                                                transform:
                                                    currentFace === 2
                                                        ? "rotateY(180deg)"
                                                        : "rotateY(0deg)",
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
                                                        fontFamily,
                                                        fontSize:
                                                            currentLines.length > 1
                                                                ? (isCookie ? "clamp(11px, 5vw, 24px)" : "clamp(9px, 4vw, 18px)")
                                                                : (isCookie ? "clamp(13px, 6vw, 26px)" : "clamp(11px, 5vw, 22px)"),
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
                                    localStorage.setItem(
                                        "petTag_petName",
                                        clamped
                                    );
                                }
                            } else {
                                setOwnerInfo(clamped);
                                if (typeof window !== "undefined") {
                                    localStorage.setItem(
                                        "petTag_ownerInfo",
                                        clamped
                                    );
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
                                        <div className="mt-4 flex justify-center">
                                            <select
                                                value={fontFamily}
                                                onChange={(e) => {
                                                    const newFont = e.target.value;
                                                    setFontFamily(newFont);
                                                    if (typeof window !== "undefined") {
                                                        localStorage.setItem("petTag_fontFamily", newFont);
                                                    }
                                                }}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                                            >
                                                <option value={cookie.style.fontFamily}>Cookie (dulce / manuscrita)</option>
                                                <option value={courgette.style.fontFamily}>Courgette (caligráfica)</option>
                                                <option value={"Georgia, 'Times New Roman', serif"}>Georgia (clásica)</option>
                                                <option value={"'Lucida Calligraphy', 'Lucida Handwriting', cursive"}>
                                                    Lucida Calligraphy (elegante)
                                                </option>
                                            </select>
                                        </div>
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
                            </>
                        )}

                        {step === 2 && (
                            <div className="max-w-md mx-auto">
                                <CustomerForm data={customerData} onChange={setCustomerData} />
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
