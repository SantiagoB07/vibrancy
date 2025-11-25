'use client';

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { X, RotateCcw } from "lucide-react";
import { JSX, useEffect, useState } from "react";
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

    const getImages = () => {
        const suffix = variant === 'gold' ? 'dorado' : variant === 'silver' ? 'plateado' : 'rosado';
        return {
            sobre: `/images/sobre-${suffix}.jpg`,
            adentro: `/images/adentro-${suffix}.jpg`
        };
    };

    const images = getImages();

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl sm:max-h-[90vh] p-0 bg-transparent border-none overflow-y-auto">
                <div className="bg-white rounded-2xl shadow-2xl min-h-[80vh] flex flex-col justify-between">
                    {/* botón cerrar */}
                    <div className="relative">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute right-4 top-6 z-20 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
                        >
                            <X className="h-5 w-5 text-gray-600" />
                        </button>

                        {/* contenido */}
                        <div className="p-8 pb-12">
                            {/* Vista del dije */}
                            <div className="flex justify-center gap-6 mb-8 items-center">
                                <div
                                    className="relative w-[300px] h-[300px] perspective-1000"
                                    style={{ transformStyle: 'preserve-3d' }}
                                >
                                    {/* cara 1: sobre */}
                                    <div
                                        className={`absolute inset-0 transition-transform duration-500 backface-hidden ${
                                            currentFace === 1 ? 'rotate-y-0' : 'rotate-y-180'
                                        }`}
                                    >
                                        <Image
                                            src={images.sobre}
                                            alt="Sobre carta"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>

                                    {/* cara 2: adentro + texto */}
                                    <div
                                        className={`absolute inset-0 transition-transform duration-500 backface-hidden ${
                                            currentFace === 2 ? 'rotate-y-0' : '-rotate-y-180'
                                        }`}
                                    >
                                        <Image
                                            src={images.adentro}
                                            alt="Carta adentro"
                                            fill
                                            className="object-contain"
                                        />
                                        {/* overlay de texto */}
                                        <div
                                            className="absolute left-1/2 top-1/2 flex items-center justify-center text-center pointer-events-none"
                                            style={{
                                                transform: 'translate(-50%, -40%)', // Ajustar posición según la imagen
                                                width: '160px', // Ajustar ancho según el área escribible
                                                height: '100px', // Ajustar alto
                                            }}
                                        >
                                            <span
                                                className="text-sm leading-tight tracking-wide text-[#3b3b3b]"
                                                style={{
                                                    fontFamily,
                                                    wordBreak: 'break-word',
                                                    whiteSpace: 'pre-wrap'
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
                                    <label htmlFor="letter-message" className="block text-sm font-medium text-gray-700 mb-1 text-center">
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
                </div>
            </DialogContent>
        </Dialog>
    );
}
