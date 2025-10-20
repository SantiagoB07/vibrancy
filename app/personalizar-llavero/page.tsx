'use client';

import {useMemo, useState, type ReactNode, JSX} from 'react';
import {ChevronDown, ChevronUp } from 'lucide-react';

type Color = 'silver' | 'black';

const IMAGES = {
    base: {
        silver: '/assets/keychain/placa-grande-silver.png',
        black: '/assets/keychain/placa-grande-black.png',
    },
    small: {
        silver: '/assets/keychain/placa-pequena-silver.png',
        black: '/assets/keychain/placa-pequena-black.png',
    },
    helmet: {
        silver: '/assets/keychain/casco-silver.png',
        black: '/assets/keychain/casco-black.png',
    },
    moto: {
        silver: '/assets/keychain/moto-silver.png',
        black: '/assets/keychain/moto-black.png',
    },
};

const PRICE = {
    base: 45000,
    addon: 10000,
};

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
    return Math.max(14, 10)
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

    const total =
        PRICE.base +
        (addHelmet ? PRICE.addon : 0) +
        (addSmall ? PRICE.addon : 0) +
        (addMoto ? PRICE.addon : 0);

    const payload = useMemo(
        () => ({
            base: { color: baseColor, text: baseText },
            helmet: addHelmet ? { color: helmetColor, text: helmetText } : null,
            small: addSmall ? { color: smallColor, text: smallText } : null,
            moto: addMoto ? { color: motoColor } : null,
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
            total,
        ]
    );

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

            <div className="mx-auto max-w-7xl p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-8 items-start">

                    {/* Vista previa - IZQUIERDA */}
                    <div className="lg:sticky lg:top-24">
                        <div className="bg-white rounded-3xl p-8 shadow-lg">
                            <div className="relative w-full aspect-square max-w-[600px] mx-auto bg-gradient-to-br from-zinc-100 to-zinc-200 rounded-2xl flex items-center justify-center overflow-hidden">

                                {/* Placa grande - CENTRO */}
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
                                        <div className="absolute inset-0 flex items-center justify-center p-4 translate-y-6  "
                                             style={{
                                                 transform: "translateY(30px)", // 🔹 mueve el bloque 30 px hacia abajo
                                             }}>
                                            <EngravedText
                                                value={baseText}
                                                boxW={130}
                                                boxH={100}
                                                maxPx={18}
                                                maxLines={3}
                                                color={baseColor}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Casco - ARRIBA IZQUIERDA */}
                                {addHelmet && (
                                    <div className="absolute" style={{
                                        width: '20%',
                                        height: '20%',
                                        top: '12%',
                                        left: '65%'
                                    }}>
                                        <div className="relative w-full h-full">
                                            <img
                                                src={IMAGES.helmet[helmetColor]}
                                                alt="Casco"
                                                className="w-full h-full object-contain"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: '20%' }}>
                                                <EngravedText
                                                    value={helmetText}
                                                    boxW={80}
                                                    boxH={40}
                                                    maxPx={16}
                                                    maxLines={2}
                                                    color={helmetColor}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Placa pequeña - ABAJO DERECHA */}
                                {addSmall && (
                                    <div className="absolute" style={{
                                        width: '25%',
                                        height: '20%',
                                        bottom: '10%',
                                        left: '70%'
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
                                                    boxW={120}
                                                    boxH={50}
                                                    maxPx={18}
                                                    maxLines={2}
                                                    color={smallColor}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Moto - ABAJO IZQUIERDA */}
                                {addMoto && (
                                    <div className="absolute" style={{
                                        width: '50%',
                                        height: '50%',
                                        bottom: '8%',
                                        right: '60%'
                                    }}>
                                        <img
                                            src={IMAGES.moto[motoColor]}
                                            alt="Moto"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
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
                                        onChange={(e) => setBaseText(e.target.value.slice(0, 200))}
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
                            onChecked={setAddHelmet}
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
                                        onChange={(e) => setHelmetText(e.target.value.slice(0, 120))}
                                        rows={2}
                                        className="w-full rounded-xl border border-zinc-300 p-3 text-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Inicial o nombre..."
                                    />
                                    <p className="text-xs text-zinc-500 mt-1">Hasta 2 líneas</p>
                                </div>
                            </div>
                        </AddonSection>

                        {/* Placa pequeña */}
                        <AddonSection
                            title="Placa pequeña"
                            price={PRICE.addon}
                            checked={addSmall}
                            onChecked={setAddSmall}
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
                                        className="w-full rounded-xl border border-zinc-300 p-3 text-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
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
                            onChecked={setAddMoto}
                            isExpanded={expandedSection === 'moto'}
                            onToggle={() => setExpandedSection(expandedSection === 'moto' ? null : 'moto')}
                            preview={<img src={IMAGES.moto[motoColor]} alt="Moto" className="w-12 h-12 object-contain" />}
                        >
                            <div className="space-y-4">
                                <ColorToggle value={motoColor} onChange={setMotoColor} />
                                <p className="text-sm text-zinc-600">Este dije no permite grabado de texto.</p>
                            </div>
                        </AddonSection>

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