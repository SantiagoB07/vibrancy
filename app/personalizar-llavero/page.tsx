'use client';

import {
    useEffect,
    useMemo,
    useState,
    useRef,
    useCallback,
    type ReactNode,
    type JSX,
} from 'react';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { CustomerForm, CustomerData } from '@/components/checkout/CustomerForm';
import { validateImageFile } from '@/lib/utils';



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

type ProductVariant = {
    id: number;
    name: string;
    color: string | null;
    price_override: number | null;
    img: string | null;
};

type ProductAddon = {
    id: number;
    product_id: number;
    addon_key: string;
    name: string;
    price: number;
    active: boolean;
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

type KeychainVectorDesign = {
    name: string;
    path: string;
    publicUrl: string;
};

const VECTOR_BUCKET = 'designs_keychain';

function useKeychainVectorDesigns() {
    const [designs, setDesigns] = useState<KeychainVectorDesign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDesigns() {
            try {
                setLoading(true);

                // LISTAR archivos en la raíz del bucket
                const { data: listData, error } = await supabase.storage
                    .from(VECTOR_BUCKET)
                    // sin ruta => raíz del bucket
                    .list(undefined, {
                        limit: 100,
                        sortBy: { column: 'name', order: 'asc' },
                    });

                console.log('RAW designs list:', listData, error);

                if (error) {
                    console.error('Error listing designs_keychain:', error);
                    setDesigns([]);
                    return;
                }

                if (!listData || listData.length === 0) {
                    setDesigns([]);
                    return;
                }

                const files = listData.filter(
                    (item) => !!item.name && !item.name.startsWith('.')
                );

                const mapped: KeychainVectorDesign[] = files.map((file) => {
                    const filePath = file.name; // raíz del bucket

                    const { data: publicData } = supabase.storage
                        .from(VECTOR_BUCKET)
                        .getPublicUrl(filePath);

                    return {
                        name: file.name,
                        path: filePath,
                        publicUrl: publicData?.publicUrl ?? '',
                    };
                });

                setDesigns(mapped);
            } catch (e) {
                console.error('Unexpected error loading vector designs:', e);
                setDesigns([]);
            } finally {
                setLoading(false);
            }
        }

        fetchDesigns();
    }, []);

    return { designs, loading };
}

// Hook para cargar addons desde la BD
function useProductAddons(productId: number) {
    const [addons, setAddons] = useState<ProductAddon[]>([]);
    const [loading, setLoading] = useState(true);
    const [basePrice, setBasePrice] = useState<number>(45000); // fallback

    useEffect(() => {
        async function fetchAddons() {
            try {
                setLoading(true);

                // Cargar precio base del producto
                const { data: productData, error: productError } = await supabase
                    .from("products")
                    .select("price")
                    .eq("id", productId)
                    .single();

                if (!productError && productData) {
                    setBasePrice(productData.price);
                }

                // Cargar addons del producto
                const { data, error } = await supabase
                    .from("product_addons")
                    .select("id, product_id, addon_key, name, price, active")
                    .eq("product_id", productId)
                    .eq("active", true);

                if (error) {
                    console.error("Error cargando addons:", error);
                    setAddons([]);
                    return;
                }

                setAddons(data || []);
            } catch (e) {
                console.error("Error inesperado cargando addons:", e);
                setAddons([]);
            } finally {
                setLoading(false);
            }
        }

        fetchAddons();
    }, [productId]);

    // Helper para obtener precio de un addon por key
    const getAddonPrice = (key: string): number => {
        const addon = addons.find(a => a.addon_key === key);
        return addon?.price ?? 0;
    };

    // Helper para obtener addon por key
    const getAddon = (key: string): ProductAddon | undefined => {
        return addons.find(a => a.addon_key === key);
    };

    return { addons, loading, basePrice, getAddonPrice, getAddon };
}

// Límite de caracteres para la placa grande
const BASE_TEXT_MAX_CHARS = 165;

const nf = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});


const PRODUCT_ID = 3;
const PRODUCT_TITLE = 'Llavero de moto personalizable';

function computeFontSize(
    value: string,
    boxW: number,
    boxH: number,
    maxPx: number,
    maxLines: number,
    preferredSize?: number
): number | null {
    const lines = value.split('\n').slice(0, maxLines);
    const avgCharWidth = 0.6;
    const lineHeight = 1.1;

    // Si hay un tamaño preferido, verificar si cabe
    if (preferredSize) {
        const fitsW = lines.every((ln) => ln.length * (preferredSize * avgCharWidth) <= boxW);
        const fitsH = lines.length * preferredSize * lineHeight <= boxH;
        if (fitsW && fitsH) return preferredSize;
        return null; // No cabe con el tamaño preferido
    }

    // Lógica original para calcular automáticamente
    for (let f = Math.min(maxPx, 48); f >= 10; f -= 1) {
        const fitsW = lines.every((ln) => ln.length * (f * avgCharWidth) <= boxW);
        const fitsH = lines.length * f * lineHeight <= boxH;
        if (fitsW && fitsH) return f;
    }
    return Math.max(10, Math.min(maxPx, 14));
}

function EngravedText({
                          value,
                          boxW,
                          boxH,
                          maxPx,
                          maxLines,
                          color,
                          preferredFontSize,
                      }: {
    value: string;
    boxW: number;
    boxH: number;
    maxPx: number;
    maxLines: number;
    color: Color;
    preferredFontSize?: number;
}) {
    const sanitized = value.replace(/\s+$/g, '');
    const fontSize = useMemo(
        () => {
            if (preferredFontSize) {
                const result = computeFontSize(sanitized, boxW, boxH, maxPx, maxLines, preferredFontSize);
                if (result !== null) return result;
            }
            return computeFontSize(sanitized, boxW, boxH, maxPx, maxLines) ?? 12;
        },
        [sanitized, boxW, boxH, maxPx, maxLines, preferredFontSize]
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
    const IMAGES = useSupabaseImages();
    const { designs: vectorDesigns, loading: loadingVectorDesigns } = useKeychainVectorDesigns();
    const { loading: loadingAddons, basePrice, getAddonPrice, getAddon } = useProductAddons(PRODUCT_ID);
    const [selectedVectorDesign, setSelectedVectorDesign] = useState<string | null>(null);
    const selectedVectorDesignData = useMemo(
        () =>
            vectorDesigns.find((design) => design.path === selectedVectorDesign) ?? null,
        [vectorDesigns, selectedVectorDesign]
    );

    const hasVectorDesign = !!selectedVectorDesignData;


    // configuraciones de llavero
    const [photoEngraving, setPhotoEngraving] = useState(false);
    const [photoImage, setPhotoImage] = useState<string | null>(null);
    const [photoUpload, setPhotoUpload] = useState<{
        storagePath: string;
        publicUrl: string;
    } | null>(null);

const [baseColor, setBaseColor] = useState<Color>('silver');
    const [baseText, setBaseText] = useState<string>('Tu mensaje');
    const [baseFontSize, setBaseFontSize] = useState<number>(12);

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

    // variantes en BD (para la placa grande)
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

// toast de advertencia
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Ref para el contenedor de vista previa (externo)
    const previewContainerRef = useRef<HTMLDivElement>(null);
    
    // Ref y escala para el contenedor de la imagen de la placa (interno)
    const baseImageContainerRef = useRef<HTMLDivElement>(null);
    const [overlayScale, setOverlayScale] = useState(1);
    const [overlayPaddingTop, setOverlayPaddingTop] = useState("18%");

    // Calcular escala basada en el ancho real del contenedor de la imagen
    const updateOverlayScale = useCallback(() => {
        if (baseImageContainerRef.current) {
            const containerWidth = baseImageContainerRef.current.offsetWidth;
            // Base de diseño: 700px
            // Escala mínima: 0.4 (móvil), máxima: 0.75 (escritorio)
            const scale = Math.max(0.4, Math.min(containerWidth / 700, 0.75));
            setOverlayScale(scale);
            
            // desktop 22, movil 40
            const paddingTop = containerWidth > 500 ? "22%" : "40%";
            setOverlayPaddingTop(paddingTop);
        }
    }, []);

    // Observar cambios de tamaño del contenedor de la imagen
    useEffect(() => {
        updateOverlayScale();
        
        const resizeObserver = new ResizeObserver(() => {
            updateOverlayScale();
        });
        
        if (baseImageContainerRef.current) {
            resizeObserver.observe(baseImageContainerRef.current);
        }
        
        return () => resizeObserver.disconnect();
    }, [updateOverlayScale]);

const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 5000); // Auto-dismiss después de 5 segundos
    };

    // Función para validar si el texto cabe con un tamaño de fuente específico
    const canFitWithFontSize = (size: number): boolean => {
        const lines = baseText.split('\n').slice(0, 8);
        const avgCharWidth = 0.6;
        const lineHeight = 1.1;
        const boxW = 130;
        const boxH = hasVectorDesign ? 110 : 120;

        const fitsW = lines.every((ln) => ln.length * (size * avgCharWidth) <= boxW);
        const fitsH = lines.length * size * lineHeight <= boxH;
        return fitsW && fitsH;
    };

    // flujo checkout
    const [step, setStep] = useState<1 | 2>(1);
    const [isPaying, setIsPaying] = useState(false);
    const [customerData, setCustomerData] = useState<CustomerData>({
        name: '',
        phone: '',
        email: '',
        address: '',
        neighborhood: '',
        locality: '',
    });

    const isCustomerFormValid =
        customerData.name.trim().length > 2 &&
        customerData.phone.trim().length >= 7 &&
        customerData.address.trim().length > 5 &&
        customerData.locality.trim().length > 2;

    // precio total del llavero (dinámico desde BD)
    const total =
        basePrice +
        (addHelmet ? getAddonPrice("helmet") : 0) +
        (addSmall ? getAddonPrice("small") : 0) +
        (addMoto ? getAddonPrice("moto") : 0) +
        (photoEngraving ? getAddonPrice("photo_engraving") : 0);

    // IDs de addons seleccionados para enviar al backend
    const selectedAddonIds = useMemo(() => {
        const ids: number[] = [];
        if (addHelmet) {
            const addon = getAddon("helmet");
            if (addon) ids.push(addon.id);
        }
        if (addSmall) {
            const addon = getAddon("small");
            if (addon) ids.push(addon.id);
        }
        if (addMoto) {
            const addon = getAddon("moto");
            if (addon) ids.push(addon.id);
        }
        if (photoEngraving) {
            const addon = getAddon("photo_engraving");
            if (addon) ids.push(addon.id);
        }
        return ids;
    }, [addHelmet, addSmall, addMoto, photoEngraving, getAddon]);

const payload = useMemo(
        () => ({
            base: { color: baseColor, text: baseText },
            helmet: addHelmet ? { color: helmetColor, text: helmetText } : null,
            small: addSmall ? { color: smallColor, text: smallText } : null,
            moto: addMoto ? { color: motoColor } : null,
            photoEngraving: photoEngraving ? { hasPhoto: !!photoImage } : null,
            vectorDesign: selectedVectorDesignData
                ? {
                    name: selectedVectorDesignData.name,
                    path: selectedVectorDesignData.path,
                    publicUrl: selectedVectorDesignData.publicUrl,
                }
                : null,
            selectedAddonIds, // IDs de addons seleccionados
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
            selectedVectorDesignData,
            selectedAddonIds,
            total,
        ]
    );





    // cargar variantes del llavero (silver/black) desde Supabase
    useEffect(() => {
        const loadVariants = async () => {
            const { data, error } = await supabase
                .from('product_variants')
                .select('id, name, color, price_override, img')
                .eq('product_id', PRODUCT_ID)
                .eq('active', true);

            if (error) {
                console.error('Error cargando variantes de llavero:', error);
                return;
            }

            const typed = (data || []) as ProductVariant[];
            setVariants(typed);

            const current = typed.find(
                (v) =>
                    v.color?.toLowerCase() === baseColor ||
                    v.name.toLowerCase().includes(baseColor)
            ) || typed[0] || null;

            setSelectedVariant(current);
        };

        loadVariants();
    }, [baseColor]);

    // cambio de color base → sincronizar variante
    const handleBaseColorChange = (c: Color) => {
        setBaseColor(c);

        if (variants.length > 0) {
            const found =
                variants.find(
                    (v) =>
                        v.color?.toLowerCase() === c ||
                        v.name.toLowerCase().includes(c)
                ) || variants[0];

            setSelectedVariant(found);
        }
    };

function applyTemplate(templateId: number) {
        switch (templateId) {
            case 1:
                setBaseColor('black');
                setBaseText(
                    'Mi amor,\nA donde quiero que\nvayas maneja con cuidado,\nuna parte de mi siempre\nte acompaña,\nDios y la virgen te bendigan.\nTe amo con todo mi corazón\n17-01-2022'
                );
                setAddMoto(true);
                setMotoColor('black');
                setAddHelmet(false);
                setAddSmall(false);
                setSelectedVectorDesign(null);
                setActiveView('base');
                setExpandedSection('base');
                break;

            case 2:
                setBaseColor('silver');
                setBaseText('De tu copiloto favorita');
                setAddSmall(false);
                setAddHelmet(true);
                setHelmetColor('black');
                setAddMoto(true);
                setMotoColor('silver');
                setSelectedVectorDesign('design_keychain8 (1).png');
                setActiveView('base');
                setExpandedSection('base');
                break;

            case 3:
                setBaseColor('silver');
                setBaseText(
                    'Mi amor\nConduce con Cuidado\nQue Dios guíe tu camino\nTe Quiero Mucho'
                );
                setAddHelmet(true);
                setHelmetColor('black');
                setHelmetText('Biker Super');
                setAddMoto(false);
                setAddSmall(false);
                setSelectedVectorDesign('design_keychain19 (1).png');
                setActiveView('base');
                setExpandedSection('base');
                break;

            case 4:
                setBaseColor('silver');
                setBaseText(
                    'A la velocidad\nque vayas y cada\nkilómetro que recorras\nte lleve tan lejos\nque superes tus límites.\nConduce siempre\nhacia tu felicidad.\n¡Te Quiero Mucho!'
                );
                setAddSmall(true);
                setSmallColor('silver');
                setSmallText('Nancy Parra');
                setAddHelmet(true);
                setHelmetColor('black');
                setHelmetText('Nancy');
                setAddMoto(true);
                setMotoColor('black');
                setSelectedVectorDesign(null);
                setActiveView('base');
                setExpandedSection('base');
                break;
        }
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Validar tipo MIME y tamaño
            const validation = validateImageFile(file);
            if (!validation.valid) {
                alert(validation.error);
                return;
            }

            // armamos un nombre único
            const ext = file.name.split('.').pop() || 'jpg';
            const fileName = `${crypto.randomUUID()}.${ext}`;
            const filePath = `llaveros/${fileName}`;

            const { error: uploadError } = await supabase
                .storage
                .from('keychains-uploads')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) {
                console.error('Error subiendo imagen del llavero:', uploadError);
                alert('No se pudo subir la imagen. Intenta de nuevo.');
                return;
            }

            // obtener URL pública
            const { data: publicData } = supabase
                .storage
                .from('keychains-uploads')
                .getPublicUrl(filePath);

            const publicUrl = publicData?.publicUrl;

            if (!publicUrl) {
                console.error('No se pudo obtener la URL pública del llavero');
                alert('No se pudo obtener la URL de la imagen.');
                return;
            }

            // guardar para preview y para el checkout
            setPhotoImage(publicUrl);
            setPhotoUpload({
                storagePath: filePath,
                publicUrl,
            });
        } catch (err) {
            console.error('Error subiendo imagen del llavero:', err);
            alert('Ocurrió un error subiendo la imagen.');
        }
    }


    if (!IMAGES || loadingAddons) {
        return <div className="p-10 text-center">Cargando...</div>;
    }

    const handlePay = async () => {
        if (!isCustomerFormValid) {
            alert('Por favor completa tus datos de envío.');
            return;
        }

        try {
            setIsPaying(true);

            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                            productId: PRODUCT_ID,
                            productVariantId: selectedVariant?.id ?? null,
                            quantity: 1,
                            selectedAddons: selectedAddonIds, // IDs de addons para calcular precio en backend
                            title: selectedVariant
                                ? `${PRODUCT_TITLE} - ${selectedVariant.name}`
                                : PRODUCT_TITLE,
                            personalizationFront: baseText || null,
                            personalizationBack: JSON.stringify(payload),
                            photos: photoUpload
                                ? [
                                    {
                                        storagePath: photoUpload.storagePath,
                                        publicUrl: photoUpload.publicUrl,
                                        position: 1,
                                    },
                                ]
                                : [],

                        },
                    ],
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                console.error('Error desde /api/checkout (llavero):', data);
                alert(data.error || 'No se pudo iniciar el pago.');
                return;
            }

            if (!data.order_id || !data.access_token) {
                console.error('Respuesta sin order_id o access_token (llavero):', data);
                alert('No se pudo crear la orden.');
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
            console.error('Error en handlePay (llavero):', error);
            alert('Error al procesar tu pedido.');
        } finally {
            setIsPaying(false);
        }
    };

return (
        <div className="min-h-screen bg-zinc-50">
            {/* Toast de advertencia */}
            {toastMessage && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-md">
                        <span className="text-xl">⚠️</span>
                        <p className="text-sm font-medium">{toastMessage}</p>
                        <button
                            onClick={() => setToastMessage(null)}
                            className="ml-2 text-amber-600 hover:text-amber-800 transition"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-zinc-900">
                        Personaliza tu Llavero
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-sm text-zinc-600">Total</div>
                            <div className="text-2xl font-bold text-zinc-900">
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
                            disabled={step === 2 && (!isCustomerFormValid || isPaying)}
                            className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-zinc-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {step === 1
                                ? 'Continuar'
                                : isPaying
                                    ? 'Procesando...'
                                    : 'Continuar al pago'}
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTENIDO */}
            <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-8">
                {step === 1 && (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-8 items-start">
                            {/* Vista previa - IZQUIERDA */}
                            <div className="lg:sticky lg:top-24">
                                <div className="bg-white rounded-3xl p-8 shadow-lg">
                                    <div 
                                        ref={previewContainerRef}
                                        className="relative w-full aspect-square max-w-[600px] mx-auto bg-gradient-to-br from-zinc-100 to-zinc-200 rounded-2xl flex items-center justify-center overflow-hidden"
                                    >
                                        {/* Placa grande */}
                                        {activeView === 'base' && (
                                            <div
                                                className="absolute"
                                                style={{
                                                    width: '120%',
                                                    height: '80%',
                                                    top: '10%',
                                                    left: '50%',
                                                    transform: 'translateX(-50%) scale(1.1)',
                                                }}
                                            >
                                                <div ref={baseImageContainerRef} className="relative w-full h-full">
                                                    <img
                                                        src={IMAGES.base[baseColor]}
                                                        alt="Placa grande"
                                                        className="w-full h-full object-contain"
                                                    />

                                                    {/* ZONA DE TEXTO + DIBUJO, ANCLADA POR ARRIBA */}
                                                    <div
                                                        className="absolute inset-0 flex items-center justify-center"
                                                        style={{ 
                                                            paddingTop: overlayPaddingTop,
                                                            transform: `scale(${overlayScale})`,
                                                            transformOrigin: "center center"
                                                        }}
                                                    >
                                                        {/* ZONA SEGURA: texto arriba, dibujo abajo */}
                                                        <div
                                                            className="flex flex-col items-center justify-between"
                                                            style={{
                                                                width: 130,
                                                                height: hasVectorDesign ? 180 : 140,
                                                            }}
                                                        >
                                                            {/* CONTENEDOR DEL TEXTO (parte superior de la zona) */}
                                                            <div
                                                                className="w-full flex items-start justify-center"
                                                            >
<EngravedText
                                                                    value={baseText}
                                                                    boxW={130}
                                                                    boxH={hasVectorDesign ? 110 : 120}
                                                                    maxPx={18}
                                                                    maxLines={8}
                                                                    color={baseColor}
                                                                    preferredFontSize={baseFontSize}
                                                                />
                                                            </div>

                                                            {/* CONTENEDOR DEL DIBUJO (parte inferior de la zona) */}
                                                            {hasVectorDesign && (
                                                                <div
                                                                    className="w-full flex items-center justify-center"
                                                                    style={{ height: 70 }}
                                                                >
                                                                    <img
                                                                        src={selectedVectorDesignData!.publicUrl}
                                                                        alt={selectedVectorDesignData!.name}
                                                                        className="h-full w-auto object-contain"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        )}


                                        {/* Casco */}
                                        {activeView === 'helmet' && addHelmet && (
                                            <div
                                                className="absolute"
                                                style={{
                                                    width: '60%',
                                                    height: '60%',
                                                    top: '20%',
                                                    left: '50%',
                                                    transform: 'translateX(-50%)',
                                                }}
                                            >
                                                <div className="relative w-full h-full">
                                                    <img
                                                        src={IMAGES.helmet[helmetColor]}
                                                        alt="Casco"
                                                        className="w-full h-full object-contain"
                                                    />
                                                    <div
                                                        className="absolute inset-0 flex items-center justify-center"
                                                        style={{ paddingTop: '15%' }}
                                                    >
                                                        <div
                                                            style={{
                                                                transform:
                                                                    'rotate(28deg) translateX(-30px)  translateY(15px)',
                                                            }}
                                                        >
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
                                            <div
                                                className="absolute"
                                                style={{
                                                    width: '70%',
                                                    height: '50%',
                                                    top: '25%',
                                                    left: '50%',
                                                    transform: 'translateX(-50%)',
                                                }}
                                            >
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
                                            <div
                                                className="absolute"
                                                style={{
                                                    width: '80%',
                                                    height: '80%',
                                                    top: '10%',
                                                    left: '50%',
                                                    transform: 'translateX(-50%)',
                                                }}
                                            >
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
                                    onToggle={() =>
                                        setExpandedSection(
                                            expandedSection === 'base' ? null : 'base'
                                        )
                                    }
                                >
                                    <div className="space-y-4">
                                        <ColorToggle
                                            value={baseColor}
                                            onChange={handleBaseColorChange}
                                        />
                                        <div>
<label className="block text-sm font-medium text-zinc-700 mb-2">
                                                Texto a grabar
                                            </label>
                                            {photoEngraving && (
                                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
                                                    <p className="text-xs text-amber-700">
                                                        <span className="font-semibold">⚠️ Campo desactivado:</span> No puedes agregar texto cuando el fotograbado está activado.
                                                    </p>
                                                </div>
                                            )}
                                            <textarea
                                                value={baseText}
                                                onChange={(e) => {
                                                    const raw = e.target.value;
                                                    // máximo 3 líneas
                                                    const limitedLines = raw.split("\n").slice(0, 8).join("\n");
                                                    const trimmed = limitedLines.slice(0, BASE_TEXT_MAX_CHARS);
                                                    setBaseText(trimmed);
                                                }}
                                                disabled={photoEngraving}
                                                rows={3}
                                                className={`w-full rounded-xl border border-zinc-300 p-3 text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    photoEngraving 
                                                        ? "bg-zinc-100 cursor-not-allowed opacity-60" 
                                                        : "bg-white"
                                                }`}
                                                placeholder={photoEngraving ? "Desactivado por fotograbado" : "Escribe tu mensaje aquí..."}
                                            />

<p className="text-xs text-zinc-500 mt-1">
                                                {baseText.length}/{BASE_TEXT_MAX_CHARS} caracteres
                                            </p>

                                            {/* Control de tamaño de fuente */}
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-zinc-700 mb-2">
                                                    Tamaño de letra
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setBaseFontSize(prev => Math.max(10, prev - 2))}
                                                        disabled={baseFontSize <= 10 || photoEngraving}
                                                        className="w-10 h-10 rounded-lg border border-zinc-300 flex items-center justify-center text-xl font-bold hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="text-sm text-zinc-600 min-w-[60px] text-center">
                                                        {baseFontSize}px
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newSize = baseFontSize + 2;
                                                            if (newSize > 18) return;
                                                            setBaseFontSize(newSize);
                                                            // Mostrar advertencia si el texto no cabe con el nuevo tamaño
                                                            if (!canFitWithFontSize(newSize)) {
                                                                showToast("El texto es demasiado largo para este tamaño. El sistema ajustará automáticamente al tamaño máximo que quepa.");
                                                            }
                                                        }}
                                                        disabled={baseFontSize >= 18 || photoEngraving}
                                                        className="w-10 h-10 rounded-lg border border-zinc-300 flex items-center justify-center text-xl font-bold hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <p className="text-xs text-zinc-500 mt-1">
                                                    Rango: 10px - 18px
                                                </p>
                                            </div>


                                            {/* Imágenes vectorizadas (opcional) */}
                                            <div className="mt-4">
                                                <p className="block text-sm font-medium text-zinc-700 mb-2">
                                                    Imágenes vectorizadas (opcional)
                                                </p>

                                                {loadingVectorDesigns && (
                                                    <p className="text-xs text-zinc-500">
                                                        Cargando diseños...
                                                    </p>
                                                )}

                                                {!loadingVectorDesigns &&
                                                    vectorDesigns.length === 0 && (
                                                        <p className="text-xs text-zinc-500">
                                                            No hay diseños disponibles por ahora.
                                                        </p>
                                                    )}

                                                {!loadingVectorDesigns &&
                                                    vectorDesigns.length > 0 && (
                                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                            {/* Opción sin dibujo */}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setSelectedVectorDesign(null)
                                                                }
                                                                className={`border rounded-md flex items-center justify-center py-4 text-xs bg-white ${
                                                                    selectedVectorDesign === null
                                                                        ? 'border-blue-500 ring-1 ring-blue-500'
                                                                        : 'border-zinc-200'
                                                                }`}
                                                            >
                                                                Sin dibujo
                                                            </button>

                                                            {vectorDesigns.map((design) => (
                                                                <button
                                                                    key={design.path}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setSelectedVectorDesign(
                                                                            design.path
                                                                        )
                                                                    }
                                                                    className={`border rounded-md p-1 flex items-center justify-center bg-white ${
                                                                        selectedVectorDesign ===
                                                                        design.path
                                                                            ? 'border-blue-500 ring-1 ring-blue-500'
                                                                            : 'border-zinc-200'
                                                                    }`}
                                                                >
                                                                    <img
                                                                        src={design.publicUrl}
                                                                        alt={design.name}
                                                                        className="w-full h-full object-contain"
                                                                    />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                            </div>


                                        </div>
                                    </div>
                                </CollapsibleSection>

                                {/* Casco */}
                                <AddonSection
                                    title="Casco"
                                    price={getAddonPrice("helmet")}
                                    checked={addHelmet}
                                    onChecked={(v) => {
                                        setAddHelmet(v);
                                        if (v) setActiveView('helmet');
                                        else if (activeView === 'helmet') setActiveView('base');
                                    }}
                                    isExpanded={expandedSection === 'helmet'}
                                    onToggle={() =>
                                        setExpandedSection(
                                            expandedSection === 'helmet' ? null : 'helmet'
                                        )
                                    }
                                    preview={
                                        <img
                                            src={IMAGES.helmet[helmetColor]}
                                            alt="Casco"
                                            className="w-12 h-12 object-contain"
                                        />
                                    }
                                >
                                    <div className="space-y-4">
                                        <ColorToggle
                                            value={helmetColor}
                                            onChange={setHelmetColor}
                                        />
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-2">
                                                Texto a grabar
                                            </label>
                                            <textarea
                                                value={helmetText}
                                                onChange={(e) => {
                                                    const raw = e.target.value;
                                                    const limitedLines = raw.split("\n").slice(0, 1).join("\n");
                                                    setHelmetText(limitedLines.slice(0, 20));
                                                }}
                                                rows={2}
                                                className="w-full rounded-xl border border-zinc-300 p-3 bg-white text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Inicial o nombre..."
                                            />

                                            <p className="text-xs text-zinc-500 mt-1">
                                                Máximo 20 caracteres
                                            </p>
                                        </div>
                                    </div>
                                </AddonSection>

                                {/* Placa pequeña */}
                                <AddonSection
                                    title="Placa pequeña"
                                    price={getAddonPrice("small")}
                                    checked={addSmall}
                                    onChecked={(v) => {
                                        setAddSmall(v);
                                        if (v) setActiveView('small');
                                        else if (activeView === 'small') setActiveView('base');
                                    }}
                                    isExpanded={expandedSection === 'small'}
                                    onToggle={() =>
                                        setExpandedSection(
                                            expandedSection === 'small' ? null : 'small'
                                        )
                                    }
                                    preview={
                                        <img
                                            src={IMAGES.small[smallColor]}
                                            alt="Placa pequeña"
                                            className="w-12 h-12 object-contain"
                                        />
                                    }
                                >
                                    <div className="space-y-4">
                                        <ColorToggle
                                            value={smallColor}
                                            onChange={setSmallColor}
                                        />
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-2">
                                                Texto a grabar
                                            </label>
                                            <textarea
                                                value={smallText}
                                                onChange={(e) => {
                                                    const raw = e.target.value;
                                                    const limitedLines = raw.split("\n").slice(0, 1).join("\n");
                                                    setSmallText(limitedLines.slice(0, 60));
                                                }}
                                                rows={2}
                                                className="w-full rounded-xl border border-zinc-300 p-3 bg-white text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Fecha o iniciales..."
                                            />

                                            <p className="text-xs text-zinc-500 mt-1">
                                                Hasta 60 caracteres
                                            </p>
                                        </div>
                                    </div>
                                </AddonSection>

                                {/* Moto */}
                                <AddonSection
                                    title="Moto"
                                    price={getAddonPrice("moto")}
                                    checked={addMoto}
                                    onChecked={(v) => {
                                        setAddMoto(v);
                                        if (v) setActiveView('moto');
                                        else if (activeView === 'moto') setActiveView('base');
                                    }}
                                    isExpanded={expandedSection === 'moto'}
                                    onToggle={() =>
                                        setExpandedSection(
                                            expandedSection === 'moto' ? null : 'moto'
                                        )
                                    }
                                    preview={
                                        <img
                                            src={IMAGES.moto[motoColor]}
                                            alt="Moto"
                                            className="w-12 h-12 object-contain"
                                        />
                                    }
                                >
                                    <div className="space-y-4">
                                        <ColorToggle
                                            value={motoColor}
                                            onChange={setMotoColor}
                                        />
                                        <p className="text-sm text-zinc-600">
                                            Este dije no permite grabado de texto.
                                        </p>
                                    </div>
                                </AddonSection>

                                {/* Fotograbado */}
                                <AddonSection
                                    title="Fotograbado"
                                    price={getAddonPrice("photo_engraving")}
                                    checked={photoEngraving}
onChecked={(v) => {
                                        setPhotoEngraving(v);
                                        if (v) {
                                            // Si activa fotograbado, limpiar el texto de la placa grande
                                            if (baseText.trim().length > 0) {
                                                showToast("El texto de la placa grande ha sido eliminado. Con fotograbado no se puede agregar texto.");
                                                setBaseText("");
                                            }
                                        } else {
                                            setPhotoImage(null);
                                            setPhotoUpload(null);
                                        }
                                    }}
                                    isExpanded={expandedSection === 'photo'}
                                    onToggle={() =>
                                        setExpandedSection(
                                            expandedSection === 'photo' ? null : 'photo'
                                        )
                                    }
                                    preview={
                                        <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center">
                                            📷
                                        </div>
                                    }
                                >
<div className="space-y-4">
                                        {/* Aviso sobre restricción de texto */}
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                            <p className="text-xs text-amber-700">
                                                <span className="font-semibold">⚠️ Importante:</span> Al activar el fotograbado, no podrás agregar texto en la placa grande. El campo de texto quedará desactivado.
                                            </p>
                                        </div>

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
                                                <p className="text-sm font-medium text-zinc-700 mb-2">
                                                    Vista previa:
                                                </p>
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
                            <h2 className="text-2xl font-bold text-zinc-900 mb-6">
                                Diseños Sugeridos
                            </h2>
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
                                        src="https://gjkmnrzeezoccbyqqeho.supabase.co/storage/v1/object/public/templates-keychains-images/combo2 (1).jpg"
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
                    </>
                )}

                {step === 2 && (
                    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-6 md:p-8">
                                                <CustomerForm data={customerData} onChange={setCustomerData} />
                    </div>
                )}
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
            <label className="block text-sm font-medium text-zinc-700 mb-2">
                Color
            </label>
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
                    {subtitle && (
                        <div className="text-sm text-zinc-500">{subtitle}</div>
                    )}
                </div>
                {isExpanded ? (
                    <ChevronUp className="text-zinc-400" />
                ) : (
                    <ChevronDown className="text-zinc-400" />
                )}
            </button>
            {isExpanded && <div className="p-4 border-t border-zinc-200">{children}</div>}
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
        <div
            className={`bg-white rounded-2xl border-2 overflow-hidden transition ${
                checked ? 'border-blue-400' : 'border-zinc-200'
            }`}
        >
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
