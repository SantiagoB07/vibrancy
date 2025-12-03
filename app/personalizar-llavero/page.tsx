'use client';

import { useEffect, useMemo, useState, type ReactNode, JSX } from 'react';

import {ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
);
type Color = 'silver' | 'black';

type ImagePaths = {
    base: { silver: string; black: string };
    small: { silver: string; black: string };
    helmet: { silver: string; black: string };
    moto: { silver: string; black: string };
};

function useSupabaseImages() {
    const [images, setImages] = useState<ImagePaths | null>(null);

    useEffect(() => {
        async function fetchUrls() {
            const categories = ['base', 'small', 'helmet', 'moto'];
            const colors = ['silver', 'black'];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const urls: any = {};

            for (const cat of categories) {
                urls[cat] = {};
                for (const color of colors) {
                    const filePath = `${cat}/${cat === 'base' ? 'placa-grande' : cat}-${color}.png`;
                    const { data } = supabase.storage
                        .from('keychains-images')
                        .getPublicUrl(filePath);

                    urls[cat][color] = data?.publicUrl ?? '';

                }
            }

            setImages(urls);
        }

        fetchUrls();
    }, []);

    return images;
}



const PRICE = {
    base: 45000,
    addon: 10000,
};

const PRICE_PHOTO = 15000;

const nf = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});


function computeFontSize(
    value: string,
    boxW: number,
    boxH: number,
    maxPx: number,
    maxLines: number
) {
    const lines = value.split('\n').slice(0, maxLines);
    const avgCharWidth = 0.6;
    const lineHeight = 1.1;
    for (let f = Math.min(maxPx, 48); f >= 10; f -= 1) {
        const fitsW = lines.every((ln) => ln.length * (f * avgCharWidth) <= boxW);
        const fitsH = lines.length * f * lineHeight <= boxH;
        if (fitsW && fitsH) return f;
    }
    return Math.max(10, Math.min(maxPx, 14))
}

function EngravedText({
                          value,
                          boxW,
                          boxH,
                          maxPx,
                          maxLines,
                          color,
                      }: {
    value: string;
    boxW: number;
    boxH: number;
    maxPx: number;
    maxLines: number;
    color: Color;
}) {
    const sanitized = value.replace(/\s+$/g, '');
    const fontSize = useMemo(
        () => computeFontSize(sanitized, boxW, boxH, maxPx, maxLines),
        [sanitized, boxW, boxH, maxPx, maxLines]
    );

    const isBlack = color === 'black';
    const textColor = isBlack ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.75)';
    const shadow = isBlack
        ? '0 1px 0 rgba(0,0,0,0.7), 0 -1px 0 rgba(255,255,255,0.35)'
        : '0 1px 0 rgba(255,255,255,0.7), 0 -1px 0 rgba(0,0,0,0.5)';

    return (
        <div
            style={{
                width: boxW,
                height: boxH,
                fontSize,
                lineHeight: 1.1,
                color: textColor,
                textShadow: shadow,
                letterSpacing: 0.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: 8,
            }}
        >
            {sanitized || ' '}
        </div>
    );
}

export default function PersonalizarLlaveroPage() {


    const [photoEngraving, setPhotoEngraving] = useState(false);
    const [photoImage, setPhotoImage] = useState<string | null>(null);
    const IMAGES = useSupabaseImages();


    const [baseColor, setBaseColor] = useState<Color>('silver');
    const [baseText, setBaseText] = useState<string>('Tu mensaje');

    const [addHelmet, setAddHelmet] = useState(false);
    const [helmetColor, setHelmetColor] = useState<Color>('silver');
    const [helmetText, setHelmetText] = useState('');

    const [addSmall, setAddSmall] = useState(false);
    const [smallColor, setSmallColor] = useState<Color>('silver');
    const [smallText, setSmallText] = useState('');

    const [addMoto, setAddMoto] = useState(false);
    const [motoColor, setMotoColor] = useState<Color>('silver');

    const [expandedSection, setExpandedSection] = useState<string | null>('base');
    const [activeView, setActiveView] = useState<'base' | 'helmet' | 'small' | 'moto'>('base');

    function applyTemplate(templateId: number) {
        switch (templateId) {
            case 1:
                // Diseño 1: Placa grande negra + Moto negra
                setBaseColor('black');
                setBaseText('Mi amor,\nA donde quiero que\nvayas maneja con cuidado,\nuna parte de mi siempre\nte acompaña,\nDios y la virgen te bendigan.\nTe amo con todo mi corazón\n17-01-2022');
                setAddMoto(true);
                setMotoColor('black');
                setAddHelmet(false);
                setAddSmall(false);
                setActiveView('base');
                setExpandedSection('base');
                break;

            case 2:
                // Diseño 2: Placa pequeña plateada + Casco negro + Moto negra
                setBaseColor('silver');
                setBaseText('Harold Parodi');
                setAddSmall(true);
                setSmallColor('silver');
                setSmallText('Harold Parodi');
                setAddHelmet(true);
                setHelmetColor('black');
                setHelmetText('Harold');
                setAddMoto(true);
                setMotoColor('black');
                setActiveView('small');
                setExpandedSection('small');
                break;

            case 3:
                // Diseño 3: Placa grande plateada + Casco negro
                setBaseColor('silver');
                setBaseText('Mi amor\nConduce con Cuidado\nQue Dios guíe tu camino\nTe Quiero Mucho');
                setAddHelmet(true);
                setHelmetColor('black');
                setHelmetText('Biker Super');
                setAddMoto(false);
                setAddSmall(false);
                setActiveView('base');
                setExpandedSection('base');
                break;

            case 4:
                // Diseño 4: Placa grande plateada + Placa pequeña plateada + Casco negro + Moto negra
                setBaseColor('silver');
                setBaseText('A la velocidad\nque vayas y cada\nkilómetro que recorras\nte lleve tan lejos\nque superes tus límites.\nConduce siempre\nhacia tu felicidad.\n¡Te Quiero Mucho!');
                setAddSmall(true);
                setSmallColor('silver');
                setSmallText('Nancy Parra');
                setAddHelmet(true);
                setHelmetColor('black');
                setHelmetText('Nancy');
                setAddMoto(true);
                setMotoColor('black');
                setActiveView('base');
                setExpandedSection('base');
                break;
        }
    }

    function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }

    const total =
        PRICE.base +
        (addHelmet ? PRICE.addon : 0) +
        (addSmall ? PRICE.addon : 0) +
        (addMoto ? PRICE.addon : 0) +
        (photoEngraving ? PRICE_PHOTO : 0);

    const payload = useMemo(
        () => ({
            base: { color: baseColor, text: baseText },
            helmet: addHelmet ? { color: helmetColor, text: helmetText } : null,
            small: addSmall ? { color: smallColor, text: smallText } : null,
            moto: addMoto ? { color: motoColor } : null,
            photoEngraving: photoEngraving ? { image: photoImage } : null,
            total,
        }),
        [
            baseColor,
            baseText,
            addHelmet,
            helmetColor,
            helmetText,
            addSmall,
            smallColor,
            smallText,
            addMoto,
            motoColor,
            photoEngraving,
            photoImage,
            total,
        ]
    );

    if (!IMAGES) {
        return <div className="p-10 text-center">Cargando imágenes...</div>;
    }

    function handlePay() {
        alert(
            'Pagar ahora: próximamente.\n\nSe enviaría esta configuración:\n' +
            JSON.stringify(payload, null, 2)
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-zinc-900">Personaliza tu Llavero</h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-sm text-zinc-600">Total</div>
                            <div className="text-2xl font-bold text-zinc-900">{nf.format(total)}</div>
                        </div>
                        <button
                            onClick={handlePay}
                            className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-zinc-800 transition"
                        >
                            Pagar ahora
                        </button>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-8 items-start">

                    {/* Vista previa - IZQUIERDA */}
                    <div className="lg:sticky lg:top-24">
                        <div className="bg-white rounded-3xl p-8 shadow-lg">
                            <div className="relative w-full aspect-square max-w-[600px] mx-auto bg-gradient-to-br from-zinc-100 to-zinc-200 rounded-2xl flex items-center justify-center overflow-hidden">

                                {/* Placa grande */}
                                {activeView === 'base' && (
                                    <div className="absolute" style={{
                                        width: '120%',
                                        height: '80%',
                                        top: '10%',
                                        left: '50%',
                                        transform: 'translateX(-50%) scale(1.1)'
                                    }}>
                                        <div className="relative w-full h-full">
                                            <img
                                                src={IMAGES.base[baseColor]}
                                                alt="Placa grande"
                                                className="w-full h-full object-contain"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center p-4 translate-y-6"
                                                 style={{
                                                     transform: "translateY(65px)",
                                                 }}>
                                                <EngravedText
                                                    value={baseText}
                                                    boxW={130}
                                                    boxH={100}
                                                    maxPx={12}
                                                    maxLines={3}
                                                    color={baseColor}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Casco */}
                                {activeView === 'helmet' && addHelmet && (
                                    <div className="absolute" style={{
                                        width: '60%',
                                        height: '60%',
                                        top: '20%',
                                        left: '50%',
                                        transform: 'translateX(-50%)'
                                    }}>
                                        <div className="relative w-full h-full">
                                            <img
                                                src={IMAGES.helmet[helmetColor]}
                                                alt="Casco"
                                                className="w-full h-full object-contain"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: '15%' }}>
                                                <div style={{ transform: 'rotate(28deg) translateX(-30px)  translateY(15px)' }}>

                                                <EngravedText
                                                    value={helmetText}
                                                    boxW={160}
                                                    boxH={80}
                                                    maxPx={24}
                                                    maxLines={2}
                                                    color={helmetColor}
                                                />
                                            </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Placa pequeña */}
                                {activeView === 'small' && addSmall && (
                                    <div className="absolute" style={{
                                        width: '70%',
                                        height: '50%',
                                        top: '25%',
                                        left: '50%',
                                        transform: 'translateX(-50%)'
                                    }}>
                                        <div className="relative w-full h-full">
                                            <img
                                                src={IMAGES.small[smallColor]}
                                                alt="Placa pequeña"
                                                className="w-full h-full object-contain"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <EngravedText
                                                    value={smallText}
                                                    boxW={200}
                                                    boxH={80}
                                                    maxPx={24}
                                                    maxLines={2}
                                                    color={smallColor}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Moto */}
                                {activeView === 'moto' && addMoto && (
                                    <div className="absolute" style={{
                                        width: '80%',
                                        height: '80%',
                                        top: '10%',
                                        left: '50%',
                                        transform: 'translateX(-50%)'
                                    }}>
                                        <img
                                            src={IMAGES.moto[motoColor]}
                                            alt="Moto"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                )}
                            </div>



                            {/* Miniaturas de navegación */}
                            <div className="flex gap-3 mt-6 justify-center flex-wrap">
                                <button
                                    onClick={() => setActiveView('base')}
                                    className={`relative w-20 h-20 rounded-xl border-2 transition p-2 ${
                                        activeView === 'base'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-zinc-300 bg-white hover:border-zinc-400'
                                    }`}
                                >
                                    <img
                                        src={IMAGES.base[baseColor]}
                                        alt="Placa grande"
                                        className="w-full h-full object-contain"
                                    />
                                    {activeView === 'base' && (
                                        <div className="absolute inset-0 ring-2 ring-blue-500 rounded-xl pointer-events-none"></div>
                                    )}
                                </button>

                                {addHelmet && (
                                    <button
                                        onClick={() => setActiveView('helmet')}
                                        className={`relative w-20 h-20 rounded-xl border-2 transition p-2 ${
                                            activeView === 'helmet'
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-zinc-300 bg-white hover:border-zinc-400'
                                        }`}
                                    >
                                        <img
                                            src={IMAGES.helmet[helmetColor]}
                                            alt="Casco"
                                            className="w-full h-full object-contain"
                                        />
                                        {activeView === 'helmet' && (
                                            <div className="absolute inset-0 ring-2 ring-blue-500 rounded-xl pointer-events-none"></div>
                                        )}
                                    </button>
                                )}

                                {addSmall && (
                                    <button
                                        onClick={() => setActiveView('small')}
                                        className={`relative w-20 h-20 rounded-xl border-2 transition p-2 ${
                                            activeView === 'small'
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-zinc-300 bg-white hover:border-zinc-400'
                                        }`}
                                    >
                                        <img
                                            src={IMAGES.small[smallColor]}
                                            alt="Placa pequeña"
                                            className="w-full h-full object-contain"
                                        />
                                        {activeView === 'small' && (
                                            <div className="absolute inset-0 ring-2 ring-blue-500 rounded-xl pointer-events-none"></div>
                                        )}
                                    </button>
                                )}

                                {addMoto && (
                                    <button
                                        onClick={() => setActiveView('moto')}
                                        className={`relative w-20 h-20 rounded-xl border-2 transition p-2 ${
                                            activeView === 'moto'
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-zinc-300 bg-white hover:border-zinc-400'
                                        }`}
                                    >
                                        <img
                                            src={IMAGES.moto[motoColor]}
                                            alt="Moto"
                                            className="w-full h-full object-contain"
                                        />
                                        {activeView === 'moto' && (
                                            <div className="absolute inset-0 ring-2 ring-blue-500 rounded-xl pointer-events-none"></div>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Controles - DERECHA */}
                    <div className="space-y-4">

                        {/* Placa grande */}
                        <CollapsibleSection
                            title="Placa grande"
                            subtitle="Incluida - Obligatoria"
                            isExpanded={expandedSection === 'base'}
                            onToggle={() => setExpandedSection(expandedSection === 'base' ? null : 'base')}
                        >
                            <div className="space-y-4">
                                <ColorToggle value={baseColor} onChange={setBaseColor} />
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                                        Texto a grabar
                                    </label>
                                    <textarea
                                        value={baseText}
                                        onChange={(e) => setBaseText(e.target.value.slice(0, 165))}
                                        rows={3}
                                        className="w-full rounded-xl border border-zinc-300 p-3 bg-white text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Escribe tu mensaje aquí..."
                                    />
                                    <p className="text-xs text-zinc-500 mt-1">Hasta 3 líneas</p>
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* Casco */}
                        <AddonSection
                            title="Casco"
                            price={PRICE.addon}
                            checked={addHelmet}
                            onChecked={(v) => {
                                setAddHelmet(v);
                                if (v) setActiveView('helmet');
                                else if (activeView === 'helmet') setActiveView('base');
                            }}
                            isExpanded={expandedSection === 'helmet'}
                            onToggle={() => setExpandedSection(expandedSection === 'helmet' ? null : 'helmet')}
                            preview={<img src={IMAGES.helmet[helmetColor]} alt="Casco" className="w-12 h-12 object-contain" />}
                        >
                            <div className="space-y-4">
                                <ColorToggle value={helmetColor} onChange={setHelmetColor} />
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                                        Texto a grabar
                                    </label>
                                    <textarea
                                        value={helmetText}
                                        onChange={(e) => setHelmetText(e.target.value.slice(0, 10))}
                                        rows={2}
                                        className="w-full rounded-xl border border-zinc-300 p-3 bg-white text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Inicial o nombre..."
                                    />
                                    <p className="text-xs text-zinc-500 mt-1">Máximo 10 caracteres</p>
                                </div>
                            </div>
                        </AddonSection>

                        {/* Placa pequeña */}
                        <AddonSection
                            title="Placa pequeña"
                            price={PRICE.addon}
                            checked={addSmall}
                            onChecked={(v) => {
                                setAddSmall(v);
                                if (v) setActiveView('small');
                                else if (activeView === 'small') setActiveView('base');
                            }}
                            isExpanded={expandedSection === 'small'}
                            onToggle={() => setExpandedSection(expandedSection === 'small' ? null : 'small')}
                            preview={<img src={IMAGES.small[smallColor]} alt="Placa pequeña" className="w-12 h-12 object-contain" />}
                        >
                            <div className="space-y-4">
                                <ColorToggle value={smallColor} onChange={setSmallColor} />
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                                        Texto a grabar
                                    </label>
                                    <textarea
                                        value={smallText}
                                        onChange={(e) => setSmallText(e.target.value.slice(0, 120))}
                                        rows={2}
                                        className="w-full rounded-xl border border-zinc-300 p-3 bg-white text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Fecha o iniciales..."
                                    />
                                    <p className="text-xs text-zinc-500 mt-1">Hasta 2 líneas</p>
                                </div>
                            </div>
                        </AddonSection>

                        {/* Moto */}
                        <AddonSection
                            title="Moto"
                            price={PRICE.addon}
                            checked={addMoto}
                            onChecked={(v) => {
                                setAddMoto(v);
                                if (v) setActiveView('moto');
                                else if (activeView === 'moto') setActiveView('base');
                            }}
                            isExpanded={expandedSection === 'moto'}
                            onToggle={() => setExpandedSection(expandedSection === 'moto' ? null : 'moto')}
                            preview={<img src={IMAGES.moto[motoColor]} alt="Moto" className="w-12 h-12 object-contain" />}
                        >
                            <div className="space-y-4">
                                <ColorToggle value={motoColor} onChange={setMotoColor} />
                                <p className="text-sm text-zinc-600">Este dije no permite grabado de texto.</p>
                            </div>
                        </AddonSection>

                        {/* Fotograbado */}
                        <AddonSection
                            title="Fotograbado"
                            price={PRICE_PHOTO}
                            checked={photoEngraving}
                            onChecked={(v) => setPhotoEngraving(v)}
                            isExpanded={expandedSection === 'photo'}
                            onToggle={() => setExpandedSection(expandedSection === 'photo' ? null : 'photo')}
                            preview={
                                <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center">
                                    📷
                                </div>
                            }
                        >
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                                        Subir imagen
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="w-full text-sm text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    <p className="text-xs text-zinc-500 mt-2">
                                        Formatos: JPG, PNG. Máx 5MB
                                    </p>
                                </div>

                                {photoImage && (
                                    <div className="mt-3">
                                        <p className="text-sm font-medium text-zinc-700 mb-2">Vista previa:</p>
                                        <img
                                            src={photoImage}
                                            alt="Preview"
                                            className="w-full h-32 object-contain rounded-lg border border-zinc-200 bg-zinc-50"
                                        />
                                    </div>
                                )}
                            </div>
                        </AddonSection>

                    </div>
                </div>

                {/* Diseños Sugeridos - ABAJO DE TODO */}
                <div className="bg-white rounded-2xl border-2 border-zinc-200 p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-zinc-900 mb-6">Diseños Sugeridos</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        <button
                            onClick={() => applyTemplate(1)}
                            className="relative aspect-square rounded-xl overflow-hidden border-2 border-zinc-300 hover:border-yellow-500 transition group"
                        >
                            <img
                                src="https://gjkmnrzeezoccbyqqeho.supabase.co/storage/v1/object/public/templates-keychains-images/combo1.jpg"
                                alt="Diseño 1"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition flex items-center justify-center">
                                <span className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold opacity-0 group-hover:opacity-100 transition shadow-lg">
                                    Aplicar diseño
                                </span>
                            </div>
                        </button>

                        <button
                            onClick={() => applyTemplate(2)}
                            className="relative aspect-square rounded-xl overflow-hidden border-2 border-zinc-300 hover:border-yellow-500 transition group"
                        >
                            <img
                                src="https://gjkmnrzeezoccbyqqeho.supabase.co/storage/v1/object/public/templates-keychains-images/combo2.jpg"
                                alt="Diseño 2"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition flex items-center justify-center">
                                <span className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold opacity-0 group-hover:opacity-100 transition shadow-lg">
                                    Aplicar diseño
                                </span>
                            </div>
                        </button>

                        <button
                            onClick={() => applyTemplate(3)}
                            className="relative aspect-square rounded-xl overflow-hidden border-2 border-zinc-300 hover:border-yellow-500 transition group"
                        >
                            <img
                                src="https://gjkmnrzeezoccbyqqeho.supabase.co/storage/v1/object/public/templates-keychains-images/combo4.jpg"
                                alt="Diseño 3"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition flex items-center justify-center">
                                <span className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold opacity-0 group-hover:opacity-100 transition shadow-lg">
                                    Aplicar diseño
                                </span>
                            </div>
                        </button>

                        <button
                            onClick={() => applyTemplate(4)}
                            className="relative aspect-square rounded-xl overflow-hidden border-2 border-zinc-300 hover:border-yellow-500 transition group"
                        >
                            <img
                                src="https://gjkmnrzeezoccbyqqeho.supabase.co/storage/v1/object/public/templates-keychains-images/combo5.jpg"
                                alt="Diseño 4"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition flex items-center justify-center">
                                <span className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold opacity-0 group-hover:opacity-100 transition shadow-lg">
                                    Aplicar diseño
                                </span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ColorToggle({
                         value,
                         onChange,
                     }: {
    value: Color;
    onChange: (c: Color) => void;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Color</label>
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => onChange('silver')}
                    className={`flex-1 h-12 rounded-xl border-2 font-medium transition ${
                        value === 'silver'
                            ? 'border-zinc-400 bg-zinc-100 text-zinc-900'
                            : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                    }`}
                >
                    Plateado
                </button>
                <button
                    type="button"
                    onClick={() => onChange('black')}
                    className={`flex-1 h-12 rounded-xl border-2 font-medium transition ${
                        value === 'black'
                            ? 'border-zinc-900 bg-zinc-900 text-white'
                            : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                    }`}
                >
                    Negro
                </button>
            </div>
        </div>
    );
}

function CollapsibleSection({
                                title,
                                subtitle,
                                isExpanded,
                                onToggle,
                                children,
                            }: {
    title: string;
    subtitle?: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: ReactNode;
}) {
    return (
        <div className="bg-white rounded-2xl border-2 border-zinc-200 overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 transition"
            >
                <div className="text-left">
                    <div className="font-semibold text-zinc-900">{title}</div>
                    {subtitle && <div className="text-sm text-zinc-500">{subtitle}</div>}
                </div>
                {isExpanded ? <ChevronUp className="text-zinc-400" /> : <ChevronDown className="text-zinc-400" />}
            </button>
            {isExpanded && (
                <div className="p-4 border-t border-zinc-200">
                    {children}
                </div>
            )}
        </div>
    );
}

function AddonSection({
                          title,
                          price,
                          checked,
                          onChecked,
                          isExpanded,
                          onToggle,
                          preview,
                          children,
                      }: {
    title: string;
    price: number;
    checked: boolean;
    onChecked: (v: boolean) => void;
    isExpanded: boolean;
    onToggle: () => void;
    preview: JSX.Element;
    children: ReactNode;
}) {
    return (
        <div className={`bg-white rounded-2xl border-2 overflow-hidden transition ${
            checked ? 'border-blue-400' : 'border-zinc-200'
        }`}>
            <div className="p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onChecked(e.target.checked)}
                        className="w-5 h-5 rounded border-zinc-300"
                    />
                    <div className="flex-1">
                        <div className="font-semibold text-zinc-900">{title}</div>
                        <div className="text-sm text-zinc-500">+ {nf.format(price)}</div>
                    </div>
                    {preview}
                </label>

                {checked && (
                    <>
                        <button
                            onClick={onToggle}
                            className="w-full mt-3 p-2 flex items-center justify-center gap-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                            {isExpanded ? 'Ocultar opciones' : 'Personalizar'}
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-zinc-200">
                                {children}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}