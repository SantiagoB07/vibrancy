'use client';

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { X, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Inter, Lobster, Coming_Soon, Pacifico, Tangerine } from 'next/font/google';

export const inter = Inter({ subsets: ['latin'], weight: ['400', '700'] });
export const lobster = Lobster({ subsets: ['latin'], weight: ['400'] });
export const comingSoon = Coming_Soon({ subsets: ['latin'], weight: ['400'] });
export const pacifico = Pacifico({ subsets: ['latin'], weight: ['400'] });
export const tangerine = Tangerine({ subsets: ['latin'], weight: ['400', '700'] });

interface LetterCharmCustomProps {
    product: {
        id: string;
        title: string;
        price: number;
        img?: string;
    };
    children: React.ReactNode;
}

const imagesByVariant: Record<
    'gold' | 'silver' | 'rose',
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

export function LetterCharmCustom({ product, children }: LetterCharmCustomProps) {
    const [isOpen, setIsOpen] = useState(false);

    // gold/silver/rose
    const [variant, setVariant] = useState<'gold' | 'silver' | 'rose'>('gold');

    // cara 1 (sobre) o cara 2 (adentro)
    const [currentFace, setCurrentFace] = useState<1 | 2>(1);
    const [isRotating, setIsRotating] = useState(false);

    // texto personalizado para adentro
    const [message, setMessage] = useState('');
    const [fontFamily, setFontFamily] = useState("'Inter', sans-serif");

    // cargar valores guardados
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const savedVariant = localStorage.getItem('letter_variant') as 'gold' | 'silver' | 'rose' | null;
        const savedMessage = localStorage.getItem('letter_message');
        const savedFont = localStorage.getItem('letter_fontFamily');

        if (savedVariant) setVariant(savedVariant);
        if (savedMessage) setMessage(savedMessage);
        if (savedFont) setFontFamily(savedFont);
    }, []);

    const toggleVariant = () => {
        const variants: ('gold' | 'silver' | 'rose')[] = ['gold', 'silver', 'rose'];
        const currentIndex = variants.indexOf(variant);
        const next = variants[(currentIndex + 1) % variants.length];
        setVariant(next);
        if (typeof window !== 'undefined') {
            localStorage.setItem('letter_variant', next);
        }
    };

    const handleRotate = () => {
        setIsRotating(true);
        setTimeout(() => {
            setCurrentFace(prev => (prev === 1 ? 2 : 1));
            setIsRotating(false);
        }, 250);
    };

    const currentImages = imagesByVariant[variant];

    // ===== HEADER: nf, total, handlePay =====
    const nf = new Intl.NumberFormat("es-CO");
    const total = product.price;

    const handlePay = () => {
        console.log("Pagar ahora (letter charm)", {
            product,
            variant,
            message,
            fontFamily,
        });
    };
    // ========================================

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>

            <DialogContent className="sm:max-w-3xl w-full max-h-[90vh] p-0 bg-transparent border-none">
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
                        <div className="px-6 py-4 flex items-center justify-between pr-16">
                            <h1 className="text-lg md:text-xl font-bold text-zinc-900">
                                Personaliza tu dije de carta
                            </h1>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-xs md:text-sm text-zinc-600">Total</div>
                                    <div className="text-lg md:text-2xl font-bold text-zinc-900">
                                        ${" "}{nf.format(total)}
                                    </div>
                                </div>
                                <button
                                    onClick={handlePay}
                                    className="bg-black text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-medium hover:bg-zinc-800 transition"
                                >
                                    Pagar ahora
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CONTENIDO CON SCROLL */}
                    <div className="flex-1 overflow-y-auto p-8 pb-10 pt-6">
                        {/* Vista del dije */}
                        <div className="flex justify-center gap-6 mb-8 items-center">
                            <div
                                className="relative w-[300px] h-[300px] perspective-1000"
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
                                            transform: 'translate(-50%, -40%)',
                                            width: '160px',
                                            height: '100px',
                                        }}
                                    >
                    <span
                        className="text-sm leading-tight tracking-wide text-[#3b3b3b]"
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
                        </div>

                        {/* Botones de control */}
                        <div className="flex justify-center mb-6 space-x-4">
                            <button
                                onClick={handleRotate}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                            >
                                <RotateCcw className="h-4 w-4" />
                                <span className="text-sm font-medium">
                  Rotar dije ({currentFace === 1 ? 'Ver adentro' : 'Ver sobre'})
                </span>
                            </button>

                            <button
                                onClick={toggleVariant}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors capitalize"
                            >
                                Color: {variant === 'rose' ? 'Rose Gold' : variant}
                            </button>
                        </div>

                        {/* Inputs de texto */}
                        <div className="space-y-4 max-w-md mx-auto">
                            <div>
                                <label
                                    htmlFor="letter-message"
                                    className="block text-sm font-medium text-gray-700 mb-1 text-center"
                                >
                                    Mensaje de la carta
                                </label>
                                <textarea
                                    id="letter-message"
                                    value={message}
                                    onChange={(e) => {
                                        const val = e.target.value.slice(0, 50); // Limite de caracteres
                                        setMessage(val);
                                        if (typeof window !== 'undefined') {
                                            localStorage.setItem('letter_message', val);
                                        }
                                    }}
                                    placeholder="Escribe tu mensaje aquí..."
                                    maxLength={50}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-sm font-semibold tracking-wide resize-none"
                                />
                                <p
                                    className={`text-xs mt-1 text-center ${
                                        message.length >= 50 ? 'text-red-500' : 'text-gray-500'
                                    }`}
                                >
                                    {message.length}/50 caracteres
                                </p>
                            </div>
                        </div>

                        {/* Selector de fuente */}
                        <div className="mt-4 flex justify-center">
                            <select
                                value={fontFamily}
                                onChange={(e) => {
                                    const newFont = e.target.value;
                                    setFontFamily(newFont);
                                    if (typeof window !== 'undefined') {
                                        localStorage.setItem('letter_fontFamily', newFont);
                                    }
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                            >
                                <option value="'Inter', sans-serif">Inter (moderno)</option>
                                <option value="'Lobster', cursive">Lobster (decorativo)</option>
                                <option value="'Pacifico', cursive">Pacifico (caligráfico)</option>
                                <option value="'Coming Soon', cursive">Coming Soon (casual)</option>
                                <option value="monospace">Monospace (teclado)</option>
                                <option value="'Tangerine', cursive">Tangerine (clásico)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
