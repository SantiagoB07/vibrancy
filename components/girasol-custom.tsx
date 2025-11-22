'use client';

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { X, RotateCcw } from "lucide-react";
import {JSX, useEffect, useState} from "react";
import Image from "next/image";
import { Inter, Lobster, Coming_Soon, Pacifico, Tangerine } from 'next/font/google';
import { createClient } from "@supabase/supabase-js";

export const inter = Inter({ subsets: ['latin'], weight: ['400', '700'] });
export const lobster = Lobster({ subsets: ['latin'], weight: ['400'] });
export const comingSoon = Coming_Soon({ subsets: ['latin'], weight: ['400'] });
export const pacifico = Pacifico({ subsets: ['latin'], weight: ['400'] });
export const tangerine = Tangerine({ subsets: ['latin'], weight: ['400', '700'] });

interface GirasolCustomProps {
    product: {
        id: string;
        title: string;
        price: number;
        img?: string;
    };
    children: React.ReactNode;
}

export function GirasolCustom({ product, children }: GirasolCustomProps) {
    const [isOpen, setIsOpen] = useState(false);

    // gold/silver
    const [variant, setVariant] = useState<'gold' | 'silver'>('gold');

    // cara 1 o cara 2
    const [currentFace, setCurrentFace] = useState<1 | 2>(1);
    const [isRotating, setIsRotating] = useState(false);

    // texto personalizado para cada cara
    const [phraseFace1, setPhraseFace1] = useState('');
    const [phraseFace2, setPhraseFace2] = useState('');
    const [fontFamily, setFontFamily] = useState("'Inter', sans-serif");

    // urls desde supabase
    const [imageUrls, setImageUrls] = useState({
        closedGold: '',
        closedSilver: '',
        openGold: '',
        openSilver: ''
    });

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
            .getPublicUrl("girasol-cerrado-gold.png").data.publicUrl;

        const closedSilverUrl = supabase.storage
            .from("girasol-images")
            .getPublicUrl("girasol-cerrado-silver.png").data.publicUrl;

        const openGoldUrl = supabase.storage
            .from("girasol-images")
            .getPublicUrl("girasol-abierto-gold.png").data.publicUrl;

        const openSilverUrl = supabase.storage
            .from("girasol-images")
            .getPublicUrl("girasol-abierto-silver.png").data.publicUrl;

        setImageUrls({
            closedGold: closedGoldUrl,
            closedSilver: closedSilverUrl,
            openGold: openGoldUrl,
            openSilver: openSilverUrl,
        });

    }, []);

    const toggleVariant = () => {
        const next = variant === 'gold' ? 'silver' : 'gold';
        setVariant(next);
        if (typeof window !== 'undefined') {
            localStorage.setItem('girasol_variant', next);
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

        const MAX = 25;
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
                            {/* Vista de los 2 girasoles */}
                            <div className="flex justify-center gap-6 mb-8 items-center">
                                {/* Girasol cerrado (estático) */}
                                <div className="relative w-[210px] h-[210px]">
                                    <Image
                                        src={
                                            variant === 'gold'
                                                ? imageUrls.closedGold || "/placeholder-girasol-cerrado-gold.png"
                                                : imageUrls.closedSilver || "/placeholder-girasol-cerrado-silver.png"
                                        }
                                        alt="Girasol cerrado"
                                        fill
                                        className="object-contain"
                                    />
                                </div>

                                {/* Girasol abierto (con rotación) */}
                                <div
                                    className="relative w-[260px] h-[210px] perspective-1000"
                                    style={{ transformStyle: 'preserve-3d' }}
                                >
                                    {/* cara 1: imagen + texto cara 1 */}
                                    <div
                                        className={`absolute inset-0 transition-transform duration-500 backface-hidden ${
                                            currentFace === 1 ? 'rotate-y-0' : 'rotate-y-180'
                                        }`}
                                    >
                                        <Image
                                            src={
                                                variant === 'gold'
                                                    ? imageUrls.openGold || "/placeholder-girasol-abierto-gold.png"
                                                    : imageUrls.openSilver || "/placeholder-girasol-abierto-silver.png"
                                            }
                                            alt="Girasol abierto (cara 1)"
                                            fill
                                            className="object-contain"
                                        />
                                        {/* overlay de texto cara 1 */}
                                        <div
                                            className="absolute left-1/2 top-1/2 flex items-center justify-center text-center pointer-events-none"
                                            style={{
                                                transform: 'translate(-50%, -50%)',
                                                width: '110px',
                                                height: '110px',
                                            }}
                                        >
                                            <span
                                                className="text-sm leading-tight tracking-wide text-[#3b3b3b]"
                                                style={{
                                                    fontFamily,
                                                    textShadow: `
                                                        0 1px 1px rgba(255,255,255,0.9),
                                                        0 2px 3px rgba(0,0,0,0.12)
                                                    `,
                                                    wordBreak: 'break-word',
                                                }}
                                            >
                                                {formatTextForCircle(phraseFace1)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* cara 2: imagen + texto cara 2 */}
                                    <div
                                        className={`absolute inset-0 transition-transform duration-500 backface-hidden ${
                                            currentFace === 2 ? 'rotate-y-0' : '-rotate-y-180'
                                        }`}
                                    >
                                        <Image
                                            src={
                                                variant === 'gold'
                                                    ? imageUrls.openGold || "/placeholder-girasol-abierto-gold.png"
                                                    : imageUrls.openSilver || "/placeholder-girasol-abierto-silver.png"
                                            }
                                            alt="Girasol abierto (cara 2)"
                                            fill
                                            className="object-contain"
                                        />
                                        {/* overlay de texto cara 2 */}
                                        <div
                                            className="absolute left-1/2 top-1/2 flex items-center justify-center text-center pointer-events-none"
                                            style={{
                                                transform: 'translate(-50%, -50%)',
                                                width: '110px',
                                                height: '110px',
                                            }}
                                        >
                                            <span
                                                className="text-sm leading-tight tracking-wide text-[#3b3b3b]"
                                                style={{
                                                    fontFamily,
                                                    textShadow: `
                                                        0 1px 1px rgba(255,255,255,0.9),
                                                        0 2px 3px rgba(0,0,0,0.12)
                                                    `,
                                                    wordBreak: 'break-word',
                                                }}
                                            >
                                                {formatTextForCircle(phraseFace2)}
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
                                        Rotar dije (Cara {currentFace === 1 ? '2' : '1'})
                                    </span>
                                </button>

                                <button
                                    onClick={toggleVariant}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                                >
                                    {variant === 'gold' ? 'Cambiar a Silver' : 'Cambiar a Gold'}
                                </button>
                            </div>

                            {/* Inputs de frases para ambas caras */}
                            <div className="space-y-4 max-w-md mx-auto">
                                {/* Campo para cara 1 */}
                                <div>
                                    <label htmlFor="girasol-text-face1" className="block text-sm font-medium text-gray-700 mb-1 text-center">
                                        Texto Cara 1
                                    </label>
                                    <input
                                        id="girasol-text-face1"
                                        type="text"
                                        value={phraseFace1}
                                        onChange={(e) => {
                                            const val = e.target.value.slice(0, 25);
                                            setPhraseFace1(val);
                                            if (typeof window !== 'undefined') {
                                                localStorage.setItem('girasol_phraseFace1', val);
                                            }
                                        }}
                                        placeholder="Frase para cara 1"
                                        maxLength={25}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-sm font-semibold tracking-wide"
                                    />
                                    <p
                                        className={`text-xs mt-1 text-center ${
                                            phraseFace1.length >= 25 ? 'text-red-500' : 'text-gray-500'
                                        }`}
                                    >
                                        {phraseFace1.length}/25 caracteres
                                    </p>
                                </div>

                                {/* Campo para cara 2 */}
                                <div>
                                    <label htmlFor="girasol-text-face2" className="block text-sm font-medium text-gray-700 mb-1 text-center">
                                        Texto Cara 2
                                    </label>
                                    <input
                                        id="girasol-text-face2"
                                        type="text"
                                        value={phraseFace2}
                                        onChange={(e) => {
                                            const val = e.target.value.slice(0, 25);
                                            setPhraseFace2(val);
                                            if (typeof window !== 'undefined') {
                                                localStorage.setItem('girasol_phraseFace2', val);
                                            }
                                        }}
                                        placeholder="Frase para cara 2"
                                        maxLength={25}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-sm font-semibold tracking-wide"
                                    />
                                    <p
                                        className={`text-xs mt-1 text-center ${
                                            phraseFace2.length >= 25 ? 'text-red-500' : 'text-gray-500'
                                        }`}
                                    >
                                        {phraseFace2.length}/25 caracteres
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
                                            localStorage.setItem('girasol_fontFamily', newFont);
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