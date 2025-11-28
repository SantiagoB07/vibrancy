'use client';

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { X, RotateCcw } from "lucide-react";
import { JSX, useEffect, useState } from "react";
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

    // formateador de número (COP)
    const nf = new Intl.NumberFormat("es-CO");
    const total = product.price; // luego puedes cambiarlo a cantidad * precio, etc.

    const handlePay = () => {
        // por ahora solo loguea, aquí luego metes tu lógica real
        console.log("Pagar ahora clickeado", {
            product,
            variant,
            phraseFace1,
            phraseFace2,
            fontFamily,
        });
    }

    // Tamaño de fuente dinámico según longitud del texto
    const getFontSizeForCircle = (text: string) => {
        const len = text.length;

        if (len <= 20) return 18;     // muy corto → fuente grande
        if (len <= 50) return 15;    // medio
        if (len <= 95) return 13;    // un poco más pequeño
        return 11;                   // casi al límite → pequeño
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
                        <div className="px-6 py-4 flex items-center justify-between pr-16">
                            <h1 className="text-lg md:text-xl font-bold text-zinc-900">
                                Personaliza tu dije de girasol
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

                    {/* contenido scrollable */}
                    <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-8 pt-4">

                    {/* layout principal */}
                        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center justify-between mb-8">
                            {/* LADO IZQUIERDO: imágenes + botones */}
                            <div className="flex flex-col items-center justify-center w-full lg:w-auto lg:pl-20">
                                {/* Vista de los 2 girasoles */}
                                <div className="flex flex-col justify-center gap-6 mb-6 items-center">
                                    {/* Girasol abierto (con rotación) */}
                                    <div
                                        className="relative w-[400px] h-[340px] perspective-1000"
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
                                                    transform: 'translate(-50%, 7%)',
                                                    width: '130px',
                                                    height: '150px',
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
                                                        fontSize: `${getFontSizeForCircle(phraseFace1)}px`,
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
                                                    transform: 'translate(-50%, 7%)',
                                                    width: '130px',
                                                    height: '150px',
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
                                                        fontSize: `${getFontSizeForCircle(phraseFace1)}px`,
                                                    }}
                                                >
                                                    {formatTextForCircle(phraseFace2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Girasol cerrado (estático) */}
                                    <div className="relative w-[400px] h-[340px]">
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
                                </div>

                                {/* Botones de control */}
                                <div className="flex flex-wrap justify-center gap-3">
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
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium"
                                    >
                                        {variant === 'gold' ? 'Cambiar a Silver' : 'Cambiar a Gold'}
                                    </button>
                                </div>
                            </div>

                            {/* LADO DERECHO: Inputs y selector de fuente */}
                            <div className="flex-1 flex flex-col justify-center items-end w-full">
                                {/* Inputs de frases para ambas caras */}
                                <div className="space-y-4 max-w-md w-full">
                                    {/* Campo para cara 1 */}
                                    <div>
                                        <label
                                            htmlFor="girasol-text-face1"
                                            className="block text-sm font-medium text-gray-700 mb-1 text-center"
                                        >
                                            Texto Cara 1
                                        </label>
                                        <input
                                            id="girasol-text-face1"
                                            type="text"
                                            value={phraseFace1}
                                            onChange={(e) => {
                                                const val = e.target.value.slice(0, 95);
                                                setPhraseFace1(val);
                                                if (typeof window !== 'undefined') {
                                                    localStorage.setItem('girasol_phraseFace1', val);
                                                }
                                            }}
                                            placeholder="Frase para cara 1"
                                            maxLength={95}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-sm font-semibold tracking-wide"
                                        />
                                        <p
                                            className={`text-xs mt-1 text-center ${
                                                phraseFace1.length >= 95 ? 'text-red-500' : 'text-gray-500'
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
                                        <input
                                            id="girasol-text-face2"
                                            type="text"
                                            value={phraseFace2}
                                            onChange={(e) => {
                                                const val = e.target.value.slice(0, 95);
                                                setPhraseFace2(val);
                                                if (typeof window !== 'undefined') {
                                                    localStorage.setItem('girasol_phraseFace2', val);
                                                }
                                            }}
                                            placeholder="Frase para cara 2"
                                            maxLength={95}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-sm font-semibold tracking-wide"
                                        />
                                        <p
                                            className={`text-xs mt-1 text-center ${
                                                phraseFace2.length >= 95 ? 'text-red-500' : 'text-gray-500'
                                            }`}
                                        >
                                            {phraseFace2.length}/95 caracteres
                                        </p>
                                    </div>
                                </div>

                                {/* Selector de fuente */}
                                <div className="mt-4 flex justify-center max-w-md ml-auto w-full">
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

                        {/* SECCIÓN DE DISEÑOS SUGERIDOS */}
                        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-6 md:p-8 mt-4">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                                Diseños Sugeridos
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
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
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
