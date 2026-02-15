'use client';

import { Dialog, DialogContent, DialogTrigger, DialogTitle, VisuallyHidden } from "@/components/ui/dialog";
import { X, RotateCcw, ShoppingCart, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Cookie, Courgette } from "next/font/google";
import { createClient } from "@supabase/supabase-js";
import { CustomerForm, CustomerData } from "@/components/checkout/CustomerForm";
import { AIPhraseModal } from "@/components/ai/ai-phrase-modal";
import { addToCart } from "@/lib/local-cart";
import { toast } from "sonner";

const cookie = Cookie({ subsets: ["latin"], weight: "400" });
const courgette = Courgette({ subsets: ["latin"], weight: "400" });

interface LetterCharmCustomProps {
    product: {
        id: string;
        title: string;
        price: number;
        img?: string;
    };
    children: React.ReactNode;
}

// === Supabase client (frontend) ===
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipo de la variante en BD
interface ProductVariant {
    id: number;
    product_id: number;
    name: string;
    color: string | null;
    material: string | null;
    price_override: number | null;
    img: string | null;
    active: boolean;
}

type VariantKey = 'gold' | 'silver' | 'rose';

const imagesByVariant: Record<
    VariantKey,
    { sobre: string; adentro: string }
> = {
    gold: {
        sobre: "https://gjkmnrzeezoccbyqqeho.supabase.co/storage/v1/object/public/letter-charm-images/sobre-dorado (1).jpg",
        adentro: "https://gjkmnrzeezoccbyqqeho.supabase.co/storage/v1/object/public/letter-charm-images/adentro-dorado (1).jpg",
    },
    silver: {
        sobre: "https://gjkmnrzeezoccbyqqeho.supabase.co/storage/v1/object/public/letter-charm-images/sobre-plateado (1).jpg",
        adentro: "https://gjkmnrzeezoccbyqqeho.supabase.co/storage/v1/object/public/letter-charm-images/adentro-plateado (1).jpg",
    },
    rose: {
        sobre: "https://gjkmnrzeezoccbyqqeho.supabase.co/storage/v1/object/public/letter-charm-images/sobre-rosado (1).jpg",
        adentro: "https://gjkmnrzeezoccbyqqeho.supabase.co/storage/v1/object/public/letter-charm-images/adentro-rosado (2).png",
    },
};

// Mapea el nombre de la variante de BD a la key visual
function mapVariantNameToKey(name: string): VariantKey {
    const n = name.toLowerCase();
    if (n.includes("rose")) return "rose";
    if (n.includes("silver") || n.includes("plateado")) return "silver";
    return "gold";
}

export function LetterCharmCustom({ product, children }: LetterCharmCustomProps) {
    const [isOpen, setIsOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isPaying, setIsPaying] = useState(false);

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



    // gold/silver/rose (para las imágenes)
    const [variantKey, setVariantKey] = useState<VariantKey>('gold');

    // variante real en BD
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

    // cara 1 (sobre) o cara 2 (adentro)
    const [currentFace, setCurrentFace] = useState<1 | 2>(2);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isRotating, setIsRotating] = useState(false);

    // texto personalizado para adentro
    const [message, setMessage] = useState('');
    const [fontFamily, setFontFamily] = useState(cookie.style.fontFamily);

    const isCookie = fontFamily === cookie.style.fontFamily;




    // ===== Cargar mensaje y fuente desde localStorage =====
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const savedMessage = localStorage.getItem('letter_message');
        const savedFont = localStorage.getItem('letter_fontFamily');
        const savedVariantKey = localStorage.getItem('letter_variant_key') as VariantKey | null;

        if (savedMessage) setMessage(savedMessage);
        if (savedFont) setFontFamily(savedFont);
        if (savedVariantKey) setVariantKey(savedVariantKey);
    }, []);

    // ===== Cargar variantes desde Supabase =====
    useEffect(() => {
        const loadVariants = async () => {
            const { data, error } = await supabase
                .from("product_variants")
                .select("*")
                .eq("product_id", Number(product.id))
                .eq("active", true)
                .order("id", { ascending: true });

            if (error) {
                console.error("Error cargando variantes de dije de carta:", error);
                return;
            }

            if (!data || data.length === 0) {
                console.warn("No hay variantes para este producto (dije de carta).");
                return;
            }

            setVariants(data as ProductVariant[]);

            // Determinar variante inicial: intento usar la guardada, si no, la primera
            let initialVariant: ProductVariant | null = null;
            if (typeof window !== 'undefined') {
                const savedVariantKey = localStorage.getItem('letter_variant_key') as VariantKey | null;
                if (savedVariantKey) {
                    const match = data.find(v => mapVariantNameToKey(v.name) === savedVariantKey);
                    if (match) {
                        initialVariant = match as ProductVariant;
                        setVariantKey(savedVariantKey);
                    }
                }
            }

            if (!initialVariant) {
                initialVariant = data[0] as ProductVariant;
                setVariantKey(mapVariantNameToKey(initialVariant.name));
            }

            setSelectedVariant(initialVariant);
        };

        loadVariants();
    }, [product.id]);

    const toggleVariant = () => {
        if (!variants.length || !selectedVariant) return;

        const currentIndex = variants.findIndex(v => v.id === selectedVariant.id);
        const nextVariant = variants[(currentIndex + 1) % variants.length];

        setSelectedVariant(nextVariant);
        const key = mapVariantNameToKey(nextVariant.name);
        setVariantKey(key);

        if (typeof window !== 'undefined') {
            localStorage.setItem('letter_variant_key', key);
        }
    };

    const handleRotate = () => {
        setIsRotating(true);
        setTimeout(() => {
            setCurrentFace(prev => (prev === 1 ? 2 : 1));
            setIsRotating(false);
        }, 250);
    };

    const currentImages = imagesByVariant[variantKey];

// ===== HEADER: nf, total, handlePay =====
    const nf = new Intl.NumberFormat("es-CO");
    const total = selectedVariant?.price_override ?? product.price;

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
        return "UNKNOWN";
    };

    const handleAddToCart = () => {
        if (!selectedVariant) {
            alert("Selecciona un color.");
            return;
        }

        addToCart({
            productId: Number(product.id),
            productVariantId: selectedVariant.id,
            variantName: selectedVariant.name,
            quantity: 1,
            title: `${product.title} - ${selectedVariant.name}`,
            unitPrice: total,
            personalizationFront: message || null,
            personalizationBack: null,
            engravingFont: getSelectedFontForDb(),
            productImage: product.img || currentImages.sobre,
        });

        toast.success("Producto agregado al carrito", {
            description: `${product.title} - ${selectedVariant.name}`,
        });

        setIsOpen(false);
    };

const handlePay = async () => {
        if (!selectedVariant) {
            alert("Selecciona un color.");
            return;
        }

        if (!isCustomerFormValid) {
            alert("Por favor completa tus datos de envío.");
            return;
        }

        try {
            setIsPaying(true);

            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerData,
                    items: [
                        {
                            productId: Number(product.id),
                            productVariantId: selectedVariant.id,
                            quantity: 1,
                            unitPrice: total,
                            title: `${product.title} - ${selectedVariant.name}`,
                            personalizationFront: message,
                            personalizationBack: null,
                            engravingFont: getSelectedFontForDb()
                        },
                    ],
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert("Error al iniciar el pago.");
                return;
            }

            if (!data.order_id || !data.access_token) {
                console.error("Respuesta sin order_id o access_token (letter-charm):", data);
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
            console.error(error);
            alert("Error al procesar tu pedido.");
        } finally {
            setIsPaying(false);
        }




    };


    // ========================================

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>

<DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl w-full max-h-[90vh] p-0 bg-transparent border-none">
                <VisuallyHidden>
                    <DialogTitle>Personaliza tu dije de carta</DialogTitle>
                </VisuallyHidden>
                <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                    {/* botón cerrar */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute right-4 top-4 z-20 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
                    >
                        <X className="h-5 w-5 text-gray-600" />
                    </button>

                    {/* HEADER DEL MODAL */}
                    <div className="bg-white border-b">
                        <div className="px-4 py-3 flex items-center justify-between pr-14">
                            <div className="flex items-center gap-2">
                                {step === 2 && (
                                    <button
                                        onClick={() => setStep(1)}
                                        className="p-1.5 hover:bg-gray-100 rounded-full transition"
                                        aria-label="Volver a personalización"
                                    >
                                        <ArrowLeft className="h-4 w-4 text-gray-600" />
                                    </button>
                                )}
                                <h1 className="text-base font-bold text-zinc-900">
                                    Personaliza tu dije de carta
                                </h1>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-right mr-1">
                                    <div className="text-xs text-zinc-500">Total</div>
                                    <div className="text-lg font-bold text-zinc-900">
                                        ${nf.format(total)}
                                    </div>
                                </div>
                                {step === 1 && (
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={!selectedVariant}
                                        className="flex items-center gap-1.5 bg-zinc-100 text-zinc-700 px-3 py-2 rounded-full font-medium hover:bg-zinc-200 disabled:opacity-60 disabled:cursor-not-allowed transition text-sm"
                                    >
                                        <ShoppingCart className="h-4 w-4" />
                                        <span className="hidden sm:inline">Carrito</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (step === 1) {
                                            setStep(2);
                                            return;
                                        }
                                        handlePay();
                                    }}
                                    disabled={step === 2 && (!isCustomerFormValid || isPaying)}
                                    className="bg-[#5E3A1E] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#4C2F18] disabled:opacity-60 disabled:cursor-not-allowed transition"
                                >
                                    {step === 1 ? "Comprar ahora" : isPaying ? "Procesando..." : "Continuar al pago"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CONTENIDO CON SCROLL */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Paso 1: personalización */}
                        {step === 1 && (
                            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                                {/* Columna izquierda: Vista del dije */}
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <div
                                        className="relative w-[260px] h-[260px] md:w-[280px] md:h-[280px] perspective-1000"
                                        style={{ transformStyle: 'preserve-3d' }}
                                    >
                                        {/* cara 1: sobre (dije cerrado) */}
                                        <div
                                            className={`absolute inset-0 transition-transform duration-500 backface-hidden ${
                                                currentFace === 1 ? 'rotate-y-0' : 'rotate-y-180'
                                            }`}
                                        >
                                            <Image
                                                src={currentImages.sobre}
                                                alt="Sobre carta"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>

                                        {/* cara 2: adentro + texto (dije abierto) */}
                                        <div
                                            className={`absolute inset-0 transition-transform duration-500 backface-hidden ${
                                                currentFace === 2 ? 'rotate-y-0' : '-rotate-y-180'
                                            }`}
                                        >
                                            <Image
                                                src={currentImages.adentro}
                                                alt="Carta adentro"
                                                fill
                                                className="object-contain"
                                            />
                                            {/* overlay de texto */}
                                            <div
                                                className="absolute left-1/2 top-1/2 flex items-center justify-center text-center pointer-events-none"
                                                style={{
                                                    transform: 'translate(-50%, -85%) rotate(-4deg)',
                                                    width: '160px',
                                                    height: '100px',
                                                }}
                                            >
                                                <span
                                                    className={`${isCookie ? "text-2xl" : "text-xl"} leading-tight tracking-wide text-[#3b3b3b]`}
                                                    style={{
                                                        fontFamily,
                                                        wordBreak: 'break-word',
                                                        whiteSpace: 'pre-wrap',
                                                    }}
                                                >
                                                    {message}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botones de control debajo de la imagen */}
                                    <div className="flex flex-wrap justify-center mt-4 gap-3">
                                        <button
                                            onClick={handleRotate}
                                            className="flex items-center space-x-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                            <span className="text-sm font-medium">
                                                {currentFace === 1 ? 'Ver adentro' : 'Ver sobre'}
                                            </span>
                                        </button>

                                        {/* Mini paleta de colores */}
                                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                                            <span className="text-sm text-gray-600">Color:</span>
                                            {variants.map((v) => {
                                                const key = mapVariantNameToKey(v.name);
                                                const isSelected = selectedVariant?.id === v.id;
                                                const colorClasses: Record<VariantKey, string> = {
                                                    gold: "bg-yellow-400",
                                                    silver: "bg-gray-300",
                                                    rose: "bg-pink-300",
                                                };
                                                return (
                                                    <button
                                                        key={v.id}
                                                        onClick={() => {
                                                            setSelectedVariant(v);
                                                            setVariantKey(key);
                                                            if (typeof window !== 'undefined') {
                                                                localStorage.setItem('letter_variant_key', key);
                                                            }
                                                        }}
                                                        className={`w-6 h-6 rounded-full ${colorClasses[key]} transition-all ${
                                                            isSelected
                                                                ? "ring-2 ring-offset-2 ring-black"
                                                                : "hover:scale-110"
                                                        }`}
                                                        title={v.name}
                                                        aria-label={`Color ${v.name}`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Columna derecha: Controles */}
                                <div className="flex-1 flex flex-col justify-center space-y-5">
                                    {/* Mensaje de la carta */}
                                    <div>
                                        <label
                                            htmlFor="letter-message"
                                            className="block text-sm font-medium text-gray-700 mb-2"
                                        >
                                            Mensaje de la carta
                                        </label>
                                        <div className="flex gap-2 items-start">
                                            <textarea
                                                id="letter-message"
                                                value={message}
                                                onChange={(e) => {
                                                    const val = e.target.value.slice(0, 50);
                                                    setMessage(val);
                                                    if (typeof window !== 'undefined') {
                                                        localStorage.setItem('letter_message', val);
                                                    }
                                                }}
                                                placeholder="Escribe tu mensaje aquí..."
                                                maxLength={50}
                                                rows={3}
                                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm font-medium resize-none"
                                            />
                                            <AIPhraseModal
                                                productType="letter-charm"
                                                maxChars={50}
                                                onSelectPhrase={(phrase) => {
                                                    setMessage(phrase);
                                                    if (typeof window !== 'undefined') {
                                                        localStorage.setItem('letter_message', phrase);
                                                    }
                                                }}
                                            >
                                                <span>Ideas</span>
                                            </AIPhraseModal>
                                        </div>
                                        <p
                                            className={`text-xs mt-1 ${
                                                message.length >= 50 ? 'text-red-500' : 'text-gray-500'
                                            }`}
                                        >
                                            {message.length}/50 caracteres
                                        </p>
                                    </div>

                                    {/* Selector de fuente */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Estilo de letra
                                        </label>
                                        <select
                                            value={fontFamily}
                                            onChange={(e) => {
                                                const newFont = e.target.value;
                                                setFontFamily(newFont);
                                                if (typeof window !== 'undefined') {
                                                    localStorage.setItem('letter_fontFamily', newFont);
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
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
                        )}
                        {step === 2 && (
                            <CustomerForm
                                data={customerData}
                                onChange={(updated) => setCustomerData(updated)}
                            />
                        )}

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
