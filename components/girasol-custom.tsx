'use client';

import { Dialog, DialogContent, DialogTrigger, DialogTitle, VisuallyHidden } from "@/components/ui/dialog";
import { X, RotateCcw } from "lucide-react";
import { JSX, useEffect, useState } from "react";
import Image from "next/image";
import { Cookie, Courgette } from "next/font/google";
import { createClient } from "@supabase/supabase-js";
import { CustomerForm, CustomerData } from "@/components/checkout/CustomerForm";
import { AIPhraseModal } from "@/components/ai/ai-phrase-modal";

const cookie = Cookie({ subsets: ["latin"], weight: "400" });
const courgette = Courgette({ subsets: ["latin"], weight: "400" });

interface GirasolCustomProps {
    product: {
        id: string;
        title: string;
        price: number;
        img?: string;
    };
    children: React.ReactNode;
}
interface ProductVariant {
    id: number;
    product_id: number;
    name: string;
    color: string | null;
    material: string | null;
    price_override: number | null;
    img: string | null;
    active: boolean | null;
    created_at: string | null;
}

type VariantKey = "gold" | "silver";

function mapVariantNameToKey(name: string): VariantKey {
    const n = name.toLowerCase();
    if (n.includes("silver") || n.includes("plateado")) return "silver";
    return "gold";
}


export function GirasolCustom({ product, children }: GirasolCustomProps) {
    const [isOpen, setIsOpen] = useState(false);

    // gold/silver
    const [variant, setVariant] = useState<VariantKey>("gold");
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

    // cara 1 o cara 2
    const [currentFace, setCurrentFace] = useState<1 | 2>(1);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isRotating, setIsRotating] = useState(false);

    // texto personalizado para cada cara
    const [phraseFace1, setPhraseFace1] = useState('');
    const [phraseFace2, setPhraseFace2] = useState('');

    const [fontFamily, setFontFamily] = useState(cookie.style.fontFamily);
    const isCookie = fontFamily === cookie.style.fontFamily;

    // urls desde supabase
    const [imageUrls, setImageUrls] = useState({
        closedGold: '',
        closedSilver: '',
        openGold: '',
        openSilver: ''
    });

    const [step, setStep] = useState<1 | 2>(1);

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

    const [isPaying, setIsPaying] = useState(false);


    // formateador de número (COP)
    const nf = new Intl.NumberFormat("es-CO");
    const total = selectedVariant?.price_override ?? product.price;

    const handlePay = async () => {
        if (!selectedVariant) {
            alert("Selecciona un color antes de continuar.");
            return;
        }

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
                            productVariantId: selectedVariant.id,
                            quantity: 1,
                            unitPrice: total,
                            title: `${product.title} - ${selectedVariant.name}`,
                            personalizationFront: phraseFace1,
                            personalizationBack: phraseFace2,
                            engravingFont: getSelectedFontForDb(),
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

            if (!data.order_id || !data.access_token) {
                console.error("Respuesta sin order_id o access_token (girasol):", data);
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
            console.error("Error en handlePay (girasol):", error);
            alert("Error al procesar tu pedido.");
        } finally {
            setIsPaying(false);
        }
    };


    // Tamaño de fuente dinámico según longitud del texto
    const getFontSizeForCircle = (text: string) => {
        const len = text.length;


        let size: number;
        if (len <= 20) size = 18;
        else if (len <= 50) size = 15;
        else if (len <= 95) size = 13;
        else size = 11;

        if (isCookie) {
            size += 5;
        }

        return size;
    };



    // cargar valores guardados
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const savedVariant = localStorage.getItem('girasol_variant') as 'gold' | 'silver' | null;
        const savedPhraseFace1 = localStorage.getItem('girasol_phraseFace1');
        const savedPhraseFace2 = localStorage.getItem('girasol_phraseFace2');
        const savedFont = localStorage.getItem('girasol_fontFamily');

        if (savedVariant) setVariant(savedVariant);
        if (savedPhraseFace1) setPhraseFace1(savedPhraseFace1);
        if (savedPhraseFace2) setPhraseFace2(savedPhraseFace2);
        if (savedFont) setFontFamily(savedFont);
    }, []);

    // traer imágenes desde supabase
    useEffect(() => {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
        );

        const closedGoldUrl = supabase.storage
            .from("girasol-images")
            .getPublicUrl("girasol-cerrado-gold (1).png").data.publicUrl;

        const closedSilverUrl = supabase.storage
            .from("girasol-images")
            .getPublicUrl("girasol-cerrado-silver (1).png").data.publicUrl;

        const openGoldUrl = supabase.storage
            .from("girasol-images")
            .getPublicUrl("girasol-abierto-gold (1).png").data.publicUrl;

        const openSilverUrl = supabase.storage
            .from("girasol-images")
            .getPublicUrl("girasol-abierto-silver (1).png").data.publicUrl;

        setImageUrls({
            closedGold: closedGoldUrl,
            closedSilver: closedSilverUrl,
            openGold: openGoldUrl,
            openSilver: openSilverUrl,
        });

    }, []);

    useEffect(() => {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
        );

        const loadVariants = async () => {
            const { data, error } = await supabase
                .from("product_variants")
                .select("*")
                .eq("product_id", Number(product.id))
                .eq("active", true)
                .order("id", { ascending: true });

            if (error) {
                console.error("Error cargando variantes de girasol:", error);
                return;
            }

            if (!data || data.length === 0) {
                console.warn("No hay variantes activas para este girasol.");
                return;
            }

            setVariants(data as ProductVariant[]);

            // Intentar respetar el último color guardado en localStorage
            const savedVariantKey = (typeof window !== "undefined"
                ? (localStorage.getItem("girasol_variant") as VariantKey | null)
                : null);

            let initialVariant: ProductVariant = data[0] as ProductVariant;

            if (savedVariantKey) {
                const match = (data as ProductVariant[]).find(
                    v => mapVariantNameToKey(v.name) === savedVariantKey
                );
                if (match) {
                    initialVariant = match;
                }
            }

            setSelectedVariant(initialVariant);
            setVariant(mapVariantNameToKey(initialVariant.name));
        };

        loadVariants();
    }, [product.id]);


    const toggleVariant = () => {
        if (!variants.length || !selectedVariant) return;

        const currentIndex = variants.findIndex(v => v.id === selectedVariant.id);
        const nextVariant = variants[(currentIndex + 1) % variants.length];

        setSelectedVariant(nextVariant);
        const key = mapVariantNameToKey(nextVariant.name);
        setVariant(key);

        if (typeof window !== "undefined") {
            localStorage.setItem("girasol_variant", key);
        }
    };


    const handleRotate = () => {
        setIsRotating(true);
        setTimeout(() => {
            setCurrentFace(prev => (prev === 1 ? 2 : 1));
            setIsRotating(false);
        }, 250);
    };

    // partir el texto para que quepa en el círculo
    const formatTextForCircle = (text: string): JSX.Element | string | null => {
        if (!text) return null;

        const MAX = 95;
        const clean = text.slice(0, MAX).trim();

        if (clean.length <= 13) return clean;

        const breakIndex = clean.lastIndexOf(' ', 13);
        const first = breakIndex > -1 ? clean.slice(0, breakIndex) : clean.slice(0, 13);
        const second = breakIndex > -1 ? clean.slice(breakIndex + 1) : clean.slice(13);

        return (
            <>
                {first}
                <br />
                {second}
            </>
        );
    };

    // función para aplicar templates
    const applyTemplate = (templateId: number) => {
        switch (templateId) {
            case 1:
                // Diseño 1: Dorado - "Te amo ❤️"
                setVariant('gold');
                setPhraseFace1('Te amo ❤️');
                setPhraseFace2('');
                setCurrentFace(1);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('girasol_variant', 'gold');
                    localStorage.setItem('girasol_phraseFace1', 'Te amo ❤️');
                    localStorage.setItem('girasol_phraseFace2', '');
                }
                break;

            case 2:
                // Diseño 2: Dorado - Mensaje mamá cielo
                setVariant('gold');
                setPhraseFace1('Hoy celebro a la mama que me dió la vida y el amor eterno de mi mami en el cielo. ¡Te amo mami!');
                setPhraseFace2('');
                setCurrentFace(1);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('girasol_variant', 'gold');
                    localStorage.setItem('girasol_phraseFace1', 'Hoy celebro a la mama que me dió la vida y el amor eterno de mi mami en el cielo. ¡Te amo mami!');
                    localStorage.setItem('girasol_phraseFace2', '');
                }
                break;

            case 3:
                // Diseño 3: Plateado - Te extraño
                setVariant('silver');
                setPhraseFace1('He pasado el tiempo y vieras que te extraño como el primer dia');
                setPhraseFace2('');
                setCurrentFace(1);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('girasol_variant', 'silver');
                    localStorage.setItem('girasol_phraseFace1', 'He pasado el tiempo y vieras que te extraño como el primer dia');
                    localStorage.setItem('girasol_phraseFace2', '');
                }
                break;

            case 4:
                // Diseño 4: Plateado - "¡Mama te amamos! Bogota 2024"
                setVariant('silver');
                setPhraseFace1('¡Mama te amamos! Bogota 2024');
                setPhraseFace2('');
                setCurrentFace(1);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('girasol_variant', 'silver');
                    localStorage.setItem('girasol_phraseFace1', '¡Mama te amamos! Bogota 2024');
                    localStorage.setItem('girasol_phraseFace2', '');
                }
                break;
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>

            {/* SOLO ORGANIZACIÓN / LAYOUT */}
            <DialogContent
                className="sm:max-w-6xl w-full max-h-[90vh] p-0 bg-transparent border-none"
            >
                <VisuallyHidden>
                    <DialogTitle>Personaliza tu girasol</DialogTitle>
                </VisuallyHidden>
                <div className="relative bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
                    {/* botón cerrar */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute right-4 top-4 z-20 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
                    >
                        <X className="h-5 w-5 text-gray-600" />
                    </button>

                    {/* HEADER DEL MODAL */}
                    <div className="bg-white border-b">
                        <div className="px-4 md:px-6 py-3 md:py-4 pr-12 md:pr-16">
                            {/* Mobile: stack vertical, Desktop: horizontal */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                                <h1 className="text-base md:text-xl font-bold text-zinc-900">
                                    Personaliza tu dije de girasol
                                </h1>
                                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                                    <div className="text-left sm:text-right">
                                        <div className="text-xs text-zinc-600">Total</div>
                                        <div className="text-base md:text-2xl font-bold text-zinc-900">
                                            ${" "}{nf.format(total)}
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
                                            step === 2 &&
                                            (!isCustomerFormValid || isPaying || !selectedVariant)
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


                    {/* contenido scrollable */}
                    <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 pt-4">
                        {/* Paso 1: personalización */}
                        {step === 1 && (
                            <>
                                {/* layout principal - siempre vertical en móvil */}
                                <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-center justify-center mb-8">
                                    {/* LADO IZQUIERDO: imágenes + botones */}
                                    <div className="flex flex-col items-center justify-center w-full lg:w-1/2">
                                        {/* Vista de los 2 girasoles */}
                                        <div className="flex flex-col justify-center gap-4 md:gap-6 mb-4 md:mb-6 items-center w-full">
                                            {/* Girasol abierto (con rotación) */}
                                            <div
                                                className="relative w-full max-w-[280px] md:max-w-[400px] aspect-[400/340] perspective-1000"
                                                style={{ transformStyle: "preserve-3d" }}
                                            >
                                                {/* cara 1: imagen + texto cara 1 */}
                                                <div
                                                    className={`absolute inset-0 transition-transform duration-500 backface-hidden ${
                                                        currentFace === 1 ? "rotate-y-0" : "rotate-y-180"
                                                    }`}
                                                >
                                                    <Image
                                                        src={
                                                            variant === "gold"
                                                                ? imageUrls.openGold || "/placeholder-girasol-abierto-gold.png"
                                                                : imageUrls.openSilver || "/placeholder-girasol-abierto-silver.png"
                                                        }
                                                        alt="Girasol abierto (cara 1)"
                                                        fill
                                                        className="object-contain"
                                                    />
                                                    {/* overlay de texto cara 1 */}
                                                    <div
                                                        className="absolute inset-0 flex items-center justify-center text-center pointer-events-none"
                                                        style={{ paddingTop: "35%" }}
                                                    >
                                                        <span
                                                            className="leading-tight tracking-wide text-[#3b3b3b] max-w-[35%]"
                                                            style={{
                                                                fontFamily,
                                                                textShadow: `
                                                                    0 1px 1px rgba(255,255,255,0.9),
                                                                    0 2px 3px rgba(0,0,0,0.12)
                                                                `,
                                                                wordBreak: "break-word",
                                                                fontSize: `clamp(10px, ${getFontSizeForCircle(phraseFace1) * 0.04}em, ${getFontSizeForCircle(phraseFace1)}px)`,
                                                            }}
                                                        >
                                                            {formatTextForCircle(phraseFace1)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* cara 2: imagen + texto cara 2 */}
                                                <div
                                                    className={`absolute inset-0 transition-transform duration-500 backface-hidden ${
                                                        currentFace === 2 ? "rotate-y-0" : "-rotate-y-180"
                                                    }`}
                                                >
                                                    <Image
                                                        src={
                                                            variant === "gold"
                                                                ? imageUrls.openGold || "/placeholder-girasol-abierto-gold.png"
                                                                : imageUrls.openSilver || "/placeholder-girasol-abierto-silver.png"
                                                        }
                                                        alt="Girasol abierto (cara 2)"
                                                        fill
                                                        className="object-contain"
                                                    />
                                                    {/* overlay de texto cara 2 */}
                                                    <div
                                                        className="absolute inset-0 flex items-center justify-center text-center pointer-events-none"
                                                        style={{ paddingTop: "35%" }}
                                                    >
                                                        <span
                                                            className="leading-tight tracking-wide text-[#3b3b3b] max-w-[35%]"
                                                            style={{
                                                                fontFamily,
                                                                textShadow: `
                                                                    0 1px 1px rgba(255,255,255,0.9),
                                                                    0 2px 3px rgba(0,0,0,0.12)
                                                                `,
                                                                wordBreak: "break-word",
                                                                fontSize: `clamp(10px, ${getFontSizeForCircle(phraseFace2) * 0.04}em, ${getFontSizeForCircle(phraseFace2)}px)`,
                                                            }}
                                                        >
                                                            {formatTextForCircle(phraseFace2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Girasol cerrado (estático) */}
                                            <div className="relative w-full max-w-[280px] md:max-w-[400px] aspect-[400/340]">
                                                <Image
                                                    src={
                                                        variant === "gold"
                                                            ? imageUrls.closedGold || "/placeholder-girasol-cerrado-gold.png"
                                                            : imageUrls.closedSilver || "/placeholder-girasol-cerrado-silver.png"
                                                    }
                                                    alt="Girasol cerrado"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                        </div>

                                        {/* Botones de control */}
                                        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                                            <button
                                                onClick={handleRotate}
                                                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                                <span className="text-sm font-medium">
                                                    Rotar dije (Cara {currentFace === 1 ? "2" : "1"})
                                                </span>
                                            </button>

                                            <button
                                                onClick={toggleVariant}
                                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium"
                                            >
                                                {variant === "gold" ? "Cambiar a Silver" : "Cambiar a Gold"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* LADO DERECHO: Inputs y selector de fuente */}
                                    <div className="flex flex-col justify-center items-center lg:items-end w-full lg:w-1/2">
                                        {/* Inputs de frases para ambas caras */}
                                        <div className="space-y-4 w-full max-w-md">
                                            {/* Campo para cara 1 */}
                                            <div>
                                                <label
                                                    htmlFor="girasol-text-face1"
                                                    className="block text-sm font-medium text-gray-700 mb-1 text-center"
                                                >
                                                    Texto Cara 1
                                                </label>
                                                <div className="flex gap-2 items-center">
                                                    <input
                                                        id="girasol-text-face1"
                                                        type="text"
                                                        value={phraseFace1}
                                                        onChange={(e) => {
                                                            const val = e.target.value.slice(0, 95);
                                                            setPhraseFace1(val);
                                                            if (typeof window !== "undefined") {
                                                                localStorage.setItem("girasol_phraseFace1", val);
                                                            }
                                                        }}
                                                        placeholder="Frase para cara 1"
                                                        maxLength={95}
                                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-sm font-semibold tracking-wide"
                                                    />
                                                    <AIPhraseModal
                                                        productType="girasol"
                                                        maxChars={95}
                                                        onSelectPhrase={(phrase) => {
                                                            setPhraseFace1(phrase);
                                                            if (typeof window !== "undefined") {
                                                                localStorage.setItem("girasol_phraseFace1", phrase);
                                                            }
                                                        }}
                                                    >
                                                        <span>Sugerir</span>
                                                    </AIPhraseModal>
                                                </div>
                                                <p
                                                    className={`text-xs mt-1 text-center ${
                                                        phraseFace1.length >= 95 ? "text-red-500" : "text-gray-500"
                                                    }`}
                                                >
                                                    {phraseFace1.length}/95 caracteres
                                                </p>
                                            </div>

                                            {/* Campo para cara 2 */}
                                            <div>
                                                <label
                                                    htmlFor="girasol-text-face2"
                                                    className="block text-sm font-medium text-gray-700 mb-1 text-center"
                                                >
                                                    Texto Cara 2
                                                </label>
                                                <div className="flex gap-2 items-center">
                                                    <input
                                                        id="girasol-text-face2"
                                                        type="text"
                                                        value={phraseFace2}
                                                        onChange={(e) => {
                                                            const val = e.target.value.slice(0, 95);
                                                            setPhraseFace2(val);
                                                            if (typeof window !== "undefined") {
                                                                localStorage.setItem("girasol_phraseFace2", val);
                                                            }
                                                        }}
                                                        placeholder="Frase para cara 2"
                                                        maxLength={95}
                                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-sm font-semibold tracking-wide"
                                                    />
                                                    <AIPhraseModal
                                                        productType="girasol"
                                                        maxChars={95}
                                                        onSelectPhrase={(phrase) => {
                                                            setPhraseFace2(phrase);
                                                            if (typeof window !== "undefined") {
                                                                localStorage.setItem("girasol_phraseFace2", phrase);
                                                            }
                                                        }}
                                                    >
                                                        <span>Sugerir</span>
                                                    </AIPhraseModal>
                                                </div>
                                                <p
                                                    className={`text-xs mt-1 text-center ${
                                                        phraseFace2.length >= 95 ? "text-red-500" : "text-gray-500"
                                                    }`}
                                                >
                                                    {phraseFace2.length}/95 caracteres
                                                </p>
                                            </div>
                                        </div>

                                        {/* Selector de fuente */}
                                        <div className="mt-4 flex justify-center w-full max-w-md">
                                            <select
                                                value={fontFamily}
                                                onChange={(e) => {
                                                    const newFont = e.target.value;
                                                    setFontFamily(newFont);
                                                    if (typeof window !== "undefined") {
                                                        localStorage.setItem("girasol_fontFamily", newFont);
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
                                    </div>
                                </div>

                                {/* SECCIÓN DE DISEÑOS SUGERIDOS */}
                                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-4 md:p-8 mt-4">
                                    <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 text-center">
                                        Diseños Sugeridos
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                                        {/* Diseño 1: Te amo ❤️ - Dorado */}
                                        <button
                                            onClick={() => applyTemplate(1)}
                                            className="relative aspect-square rounded-xl overflow-hidden border-2 border-amber-300 hover:border-yellow-500 transition group bg-gradient-to-br from-yellow-400 to-amber-500"
                                        >
                                            <img
                                                src="https://gjkmnrzeezoccbyqqeho.supabase.co/storage/v1/object/public/templates-sunflowers-images/sunflower1.jpg"
                                                alt="Diseño 1"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition flex items-center justify-center">
                                                <span className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold opacity-0 group-hover:opacity-100 transition shadow-lg">
                                                    Aplicar diseño
                                                </span>
                                            </div>
                                        </button>

                                        {/* Diseño 2: Mamá cielo - Dorado */}
                                        <button
                                            onClick={() => applyTemplate(2)}
                                            className="relative aspect-square rounded-xl overflow-hidden border-2 border-amber-300 hover:border-yellow-500 transition group bg-gradient-to-br from-yellow-400 to-amber-500"
                                        >
                                            <img
                                                src="https://gjkmnrzeezoccbyqqeho.supabase.co/storage/v1/object/public/templates-sunflowers-images/sunflower2.jpg"
                                                alt="Diseño 2"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition flex items-center justify-center">
                                                <span className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold opacity-0 group-hover:opacity-100 transition shadow-lg">
                                                    Aplicar diseño
                                                </span>
                                            </div>
                                        </button>

                                        {/* Diseño 3: Te extraño - Plateado */}
                                        <button
                                            onClick={() => applyTemplate(3)}
                                            className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-300 hover:border-gray-500 transition group bg-gradient-to-br from-gray-300 to-gray-400"
                                        >
                                            <img
                                                src="https://gjkmnrzeezoccbyqqeho.supabase.co/storage/v1/object/public/templates-sunflowers-images/sunflower3.jpg"
                                                alt="Diseño 3"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition flex items-center justify-center">
                                                <span className="bg-gray-500 text-white px-4 py-2 rounded-full text-sm font-semibold opacity-0 group-hover:opacity-100 transition shadow-lg">
                                                    Aplicar diseño
                                                </span>
                                            </div>
                                        </button>

                                        {/* Diseño 4: Mamá te amamos - Plateado */}
                                        <button
                                            onClick={() => applyTemplate(4)}
                                            className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-300 hover:border-gray-500 transition group bg-gradient-to-br from-gray-300 to-gray-400"
                                        >
                                            <img
                                                src="https://gjkmnrzeezoccbyqqeho.supabase.co/storage/v1/object/public/templates-sunflowers-images/sunflower4.jpg"
                                                alt="Diseño 4"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition flex items-center justify-center">
                                                <span className="bg-gray-500 text-white px-4 py-2 rounded-full text-sm font-semibold opacity-0 group-hover:opacity-100 transition shadow-lg">
                                                    Aplicar diseño
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <div className="mt-4 mb-8">
                                <CustomerForm
                                    data={customerData}
                                    onChange={setCustomerData}
                                />
                            </div>
                        )}
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}

