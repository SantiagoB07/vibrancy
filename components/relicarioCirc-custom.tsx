'use client';

import { Dialog, DialogContent, DialogTrigger, DialogTitle, VisuallyHidden } from "@/components/ui/dialog";
import { X, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { Cookie, Courgette } from "next/font/google";

import { CustomerForm, CustomerData } from "@/components/checkout/CustomerForm";
import { validateImageFile } from "@/lib/utils";
import { RELICARIO_PRESET_DESIGNS, type RelicarioPresetDesign } from "@/lib/relicarios/preset-designs";

// ===========================
// Fonts
// ===========================
const cookieFont = Cookie({ subsets: ["latin"], weight: "400" });
const courgetteFont = Courgette({ subsets: ["latin"], weight: "400" });

// ===========================
// Supabase client
// ===========================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===========================
// Product Variant type
// ===========================
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

// Props
interface RelicarioCircCustomProps {
  product: {
    id: string;
    title: string;
    price: number;
    img?: string;
  };
  children: React.ReactNode;
}

export function RelicarioCircCustom({ product, children }: RelicarioCircCustomProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [isPaying, setIsPaying] = useState(false);

  // ===========================
  // Customer form state
  // ===========================
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

  // ===========================
  // Variants
  // ===========================
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // ===========================
  // Customization fields
  // ===========================
  const [frontMessage, setFrontMessage] = useState("");
  const [backMessage, setBackMessage] = useState("");
  const [fontFamily, setFontFamily] = useState(cookieFont.style.fontFamily);
  const isCookie = fontFamily === cookieFont.style.fontFamily;

  const designEditorEnabled = process.env.NEXT_PUBLIC_RELICARIO_DESIGN_EDITOR === "true";

  const [textColor, setTextColor] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("relicarioCirc_textColor") || "#3b3b3b";
    }
    return "#3b3b3b";
  });

  const [designFontSize, setDesignFontSize] = useState(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("relicarioCirc_fontSize")) || 20;
    }
    return 20;
  });

  // Diseño para el frente (anverso)
  const [frontDesignConfig, setFrontDesignConfig] = useState<RelicarioPresetDesign | null>(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("relicarioCirc_design_front");
      if (raw) {
        try {
          return JSON.parse(raw) as RelicarioPresetDesign;
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  // Diseño para el reverso
  const [backDesignConfig, setBackDesignConfig] = useState<RelicarioPresetDesign | null>(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("relicarioCirc_design_back");
      if (raw) {
        try {
          return JSON.parse(raw) as RelicarioPresetDesign;
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  // ===========================
  // Rotation state
  // ===========================
  const [currentFace, setCurrentFace] = useState<1 | 2>(1);
  const [isRotating, setIsRotating] = useState(false);

  // Diseño efectivo según la cara actual
  const effectiveDesign = currentFace === 1 ? frontDesignConfig : backDesignConfig;
  const effectiveFrontDesign = frontDesignConfig;
  const effectiveBackDesign = backDesignConfig;

  const chooseDesign = (design: RelicarioPresetDesign | null) => {
    const nextDesign = design ? ({ ...design } as RelicarioPresetDesign) : null;
    const storageKey = currentFace === 1 ? "relicarioCirc_design_front" : "relicarioCirc_design_back";
    
    if (currentFace === 1) {
      setFrontDesignConfig(nextDesign);
    } else {
      setBackDesignConfig(nextDesign);
    }

    if (typeof window !== "undefined") {
      if (nextDesign) {
        localStorage.setItem(storageKey, JSON.stringify(nextDesign));

        // Aplicar texto por defecto solo si el campo está vacío
        if (currentFace === 1 && !frontMessage && nextDesign.defaultText) {
          setFrontMessage(nextDesign.defaultText);
        } else if (currentFace === 2 && !backMessage && nextDesign.defaultText) {
          setBackMessage(nextDesign.defaultText);
        }

        if (nextDesign.fontFamily) {
          setFontFamily(nextDesign.fontFamily);
          localStorage.setItem("relicarioCirc_fontFamily", nextDesign.fontFamily);
        }
        if (nextDesign.color) {
          setTextColor(nextDesign.color);
          localStorage.setItem("relicarioCirc_textColor", nextDesign.color);
        }
        if (nextDesign.fontSize) {
          setDesignFontSize(nextDesign.fontSize);
          localStorage.setItem("relicarioCirc_fontSize", String(nextDesign.fontSize));
        }
      } else {
        localStorage.removeItem(storageKey);
      }
    }
  };

  const updateSelectedDesignConfig = (patch: Partial<RelicarioPresetDesign>) => {
    const storageKey = currentFace === 1 ? "relicarioCirc_design_front" : "relicarioCirc_design_back";
    const setConfig = currentFace === 1 ? setFrontDesignConfig : setBackDesignConfig;
    
    setConfig((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(next));
      }
      return next;
    });
  };

  // ===========================
  // Character limit
  // ===========================
  const MAX_CHARS = 15;

  // ===========================
  // Images (max 2)
  // ===========================
  const [images, setImages] = useState<File[]>([]);
  const MAX_IMAGES = 2;

  // Base images for relicario (by variant)
  const baseImages = {
    gold: "https://gjkmnrzeezoccbyqqeho.supabase.co/storage/v1/object/public/relicarios-images/relicario-circle-gold.png",
    silver: "https://gjkmnrzeezoccbyqqeho.supabase.co/storage/v1/object/public/relicarios-images/relicario-circle-silver.png"
  };

  // ===========================
  // Load variants from Supabase
  // ===========================
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", Number(product.id))
          .eq("active", true);

      if (error) {
        console.error("Error cargando variantes:", error);
        return;
      }

      if (data && data.length > 0) {
        setVariants(data as ProductVariant[]);
        setSelectedVariant(data[0] as ProductVariant);
      }
    };

    load();
  }, [product.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setFontFamily(localStorage.getItem("relicarioCirc_fontFamily") || cookieFont.style.fontFamily);
  }, []);

  const toggleVariant = () => {
    if (!variants.length || !selectedVariant) return;

    const currentIndex = variants.findIndex(v => v.id === selectedVariant.id);
    const nextVariant = variants[(currentIndex + 1) % variants.length];

    setSelectedVariant(nextVariant);
  };

  // ===========================
  // Handle rotation
  // ===========================
  const handleRotate = () => {
    setIsRotating(true);
    setTimeout(() => {
      setCurrentFace((prev) => (prev === 1 ? 2 : 1));
      setIsRotating(false);
    }, 250);
  };

  // ===========================
  // Format text with line break
  // ===========================
  const formatTextWithBreak = (text: string): React.ReactNode => {
    if (!text) return text;
    const normalized = text.trim();
    const LIMIT = 8;
    if (normalized.length <= LIMIT) return normalized;

    let splitIndex = normalized.lastIndexOf(" ", LIMIT);
    if (splitIndex <= 0) {
      const after = normalized.indexOf(" ", LIMIT);
      if (after > -1) splitIndex = after;
      else splitIndex = LIMIT;
    }

    const first = normalized.slice(0, splitIndex).trimEnd();
    const second = normalized.slice(splitIndex).trimStart();

    return (
        <>
          {first}
          <br />
          {second}
        </>
    );
  };

  // ===========================
  // Upload to Supabase
  // ===========================
  const uploadPhoto = async (file: File, position: number) => {
    // Validar tipo MIME y tamaño
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return null;
    }

    const fileExt = file.name.split(".").pop();
    const filePath = `relicario-circular/${Date.now()}_${position}.${fileExt}`;

    const { error } = await supabase.storage
        .from("relicario-uploads")
        .upload(filePath, file);

    if (error) {
      console.error("Error subiendo imagen:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
        .from("relicario-uploads")
        .getPublicUrl(filePath);

    return {
      storagePath: filePath,
      publicUrl: urlData.publicUrl,
      position,
    };
  };

  // ===========================
  // Select font for DB
  // ===========================
  const getSelectedFontForDb = () => {
    if (fontFamily === cookieFont.style.fontFamily) return "COOKIE";
    if (fontFamily === courgetteFont.style.fontFamily) return "COURGETTE";
    if (fontFamily === "Georgia, 'Times New Roman', serif") return "GEORGIA";
    if (fontFamily === "'Lucida Calligraphy', 'Lucida Handwriting', cursive")
      return "LUCIDA_CALLIGRAPHY";
    return "UNKNOWN";
  };

  // ===========================
  // HANDLE PAY
  // ===========================
  const handlePay = async () => {
    if (!selectedVariant) {
      alert("Selecciona una variante.");
      return;
    }

    if (!isCustomerFormValid) {
      alert("Completa tus datos de envío.");
      return;
    }

    setIsPaying(true);

    try {
      // Upload all photos
      const photosForCheckout = [];

      for (let i = 0; i < images.length; i++) {
        const uploaded = await uploadPhoto(images[i], i + 1);
        if (uploaded) photosForCheckout.push(uploaded);
      }

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
              unitPrice: selectedVariant.price_override ?? product.price,
              title: `${product.title} - ${selectedVariant.name}`,
              personalizationFront: frontMessage || null,
              personalizationBack: backMessage || null,
              engravingFont: getSelectedFontForDb(),
              photos: photosForCheckout,
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
        console.error("Respuesta sin order_id o access_token (relicarioCirc):", data);
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
    } catch (err) {
      console.error(err);
      alert("Error al procesar tu pedido.");
    } finally {
      setIsPaying(false);
    }
  };

  // ===========================
  // PRICE
  // ===========================
  const nf = new Intl.NumberFormat("es-CO");
  const total = selectedVariant?.price_override ?? product.price;

  // Determine base image by variant
  const variantName = selectedVariant?.name?.toLowerCase() || "";
  const isGold = variantName.includes("gold") || variantName.includes("dorado");
  const baseImg = isGold ? baseImages.gold : baseImages.silver;

  // ===========================
  // RENDER
  // ===========================
  return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>

<DialogContent className="sm:max-w-5xl lg:max-w-6xl w-full max-h-[90vh] p-0 bg-transparent border-none">
          <VisuallyHidden>
            <DialogTitle>Personaliza tu relicario circular</DialogTitle>
          </VisuallyHidden>
          <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

            {/* Close button */}
            <button
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 z-20 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>

            {/* HEADER */}
            <div className="bg-white border-b">
              <div className="px-4 md:px-6 py-3 md:py-4 pr-12 md:pr-16">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <h1 className="text-base md:text-xl font-bold text-zinc-900">
                    Personaliza tu relicario circular
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
                          (!selectedVariant && variants.length > 0) ||
                          (step === 2 && (!isCustomerFormValid || isPaying))
                        }
                        className="bg-black text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-medium hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition text-sm md:text-base"
                    >
                      {step === 1 ? "Continuar" : isPaying ? "Procesando..." : "Continuar al pago"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* CONTENIDO */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-10 pt-6">

              {/* STEP 1 */}
              {step === 1 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    {/* COLUMNA IZQUIERDA: Preview del relicario */}
                    <div className="flex flex-col">
                    {/* Preview del relicario con rotación */}
                    <div className="flex justify-center mb-4 lg:mb-6">
                      <div
                          className="relative w-[300px] h-[300px] perspective-1000"
                          style={{ transformStyle: "preserve-3d" }}
                      >
                        {/* Frente (Anverso) */}
                        <div
                            className={`absolute inset-0 transition-transform duration-500 backface-hidden ${
                                currentFace === 1 ? "rotate-y-0" : "rotate-y-180"
                            }`}
                        >
                          <Image
                              src={baseImg}
                              alt="Relicario circular (frente)"
                              fill
                              className="object-contain"
                          />

                          {/* Overlay texto frente */}
                          <div
                              className="absolute inset-0 flex items-center justify-center"
                              style={{
                                opacity: currentFace === 1 && !isRotating ? 1 : 0,
                                transition: "opacity 0.2s ease-in-out",
                              }}
                          >
                            {effectiveFrontDesign ? (
                              <div className="absolute inset-0 pointer-events-none z-10">
                                <div
                                  style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: "50%",
                                    transform: "translate(-50%, -50%)",
                                  }}
                                >
                                  {(() => {
                                    const txt = formatTextWithBreak(frontMessage || effectiveFrontDesign.defaultText || "");
                                    const svgOx = effectiveFrontDesign.offsetX ?? 0;
                                    const svgOy = effectiveFrontDesign.offsetY ?? 0;
                                    let baseSize = effectiveFrontDesign.fontSize ?? designFontSize;
                                    if (isCookie) baseSize += 2;
                                    const computedFontSize =
                                      effectiveFrontDesign.position === "right" ? Math.round(baseSize * 0.85) : baseSize;

                                    const isSideText = effectiveFrontDesign.position === "left" || effectiveFrontDesign.position === "right";

                                    const baseStyle = {
                                      fontFamily: effectiveFrontDesign.fontFamily || fontFamily,
                                      color: effectiveFrontDesign.color || textColor,
                                      fontSize: `${computedFontSize}px`,
                                      lineHeight: "1.05",
                                      textAlign: isSideText ? "left" : "center",
                                      width: isSideText ? undefined : (effectiveFrontDesign.width ?? 150),
                                      padding:
                                        isSideText ? "0" : "0 8px",
                                    } as React.CSSProperties;
                                    const textOx = effectiveFrontDesign.textOffsetX ?? 0;
                                    const textOy = effectiveFrontDesign.textOffsetY ?? 0;
                                    const horizGap = -20;

                                    switch (effectiveFrontDesign.position) {
                                      case "below":
                                        return (
                                          <div className="flex flex-col items-center">
                                            <div
                                              className="relative"
                                              style={{
                                                width: effectiveFrontDesign.width ?? 150,
                                                height: effectiveFrontDesign.height ?? 84,
                                                overflow: "hidden",
                                                transform: `translate(${svgOx}px, ${svgOy}px)`,
                                              }}
                                            >
                                              <Image
                                                src={effectiveFrontDesign.path}
                                                alt={effectiveFrontDesign.label || ""}
                                                width={effectiveFrontDesign.width ?? 150}
                                                height={effectiveFrontDesign.height ?? 84}
                                                className="object-contain"
                                              />
                                            </div>
                                            <div style={{ ...baseStyle, marginTop: textOy, transform: `translateX(${textOx}px)` }}>{txt}</div>
                                          </div>
                                        );
                                      case "above":
                                        return (
                                          <div className="flex flex-col items-center">
                                            <div style={{ ...baseStyle, marginBottom: textOy, transform: `translateX(${textOx}px)` }}>{txt}</div>
                                            <div
                                              className="relative"
                                              style={{
                                                width: effectiveFrontDesign.width ?? 150,
                                                height: effectiveFrontDesign.height ?? 84,
                                                overflow: "hidden",
                                                transform: `translate(${svgOx}px, ${svgOy}px)`,
                                              }}
                                            >
                                              <Image
                                                src={effectiveFrontDesign.path}
                                                alt={effectiveFrontDesign.label || ""}
                                                width={effectiveFrontDesign.width ?? 150}
                                                height={effectiveFrontDesign.height ?? 84}
                                                className="object-contain"
                                              />
                                            </div>
                                          </div>
                                        );
                                      case "left":
                                        return (
                                          <div className="flex items-center">
                                            <div style={{ ...baseStyle, marginRight: horizGap, transform: `translate(${textOx}px, ${textOy}px)` }}>{txt}</div>
                                            <div
                                              className="relative"
                                              style={{
                                                width: effectiveFrontDesign.width ?? 150,
                                                height: effectiveFrontDesign.height ?? 84,
                                                overflow: "hidden",
                                                transform: `translate(${svgOx}px, ${svgOy}px)`,
                                              }}
                                            >
                                              <Image
                                                src={effectiveFrontDesign.path}
                                                alt={effectiveFrontDesign.label || ""}
                                                width={effectiveFrontDesign.width ?? 150}
                                                height={effectiveFrontDesign.height ?? 84}
                                                className="object-contain"
                                              />
                                            </div>
                                          </div>
                                        );
                                      case "right":
                                        return (
                                          <div className="flex items-center">
                                            <div
                                              className="relative"
                                              style={{
                                                width: effectiveFrontDesign.width ?? 150,
                                                height: effectiveFrontDesign.height ?? 84,
                                                overflow: "hidden",
                                                transform: `translate(${svgOx}px, ${svgOy}px)`,
                                              }}
                                            >
                                              <Image
                                                src={effectiveFrontDesign.path}
                                                alt={effectiveFrontDesign.label || ""}
                                                width={effectiveFrontDesign.width ?? 150}
                                                height={effectiveFrontDesign.height ?? 84}
                                                className="object-contain"
                                              />
                                            </div>
                                            <div style={{ ...baseStyle, marginLeft: horizGap, transform: `translate(${textOx}px, ${textOy}px)` }}>{txt}</div>
                                          </div>
                                        );
                                      case "center":
                                      default:
                                        return (
                                          <div
                                            className="relative"
                                            style={{
                                              width: effectiveFrontDesign.width ?? 150,
                                              height: effectiveFrontDesign.height ?? 84,
                                              overflow: "visible",
                                            }}
                                          >
                                            <div
                                              className="relative"
                                              style={{
                                                width: effectiveFrontDesign.width ?? 150,
                                                height: effectiveFrontDesign.height ?? 84,
                                                overflow: "hidden",
                                                transform: `translate(${svgOx}px, ${svgOy}px)`,
                                              }}
                                            >
                                              <Image
                                                src={effectiveFrontDesign.path}
                                                alt={effectiveFrontDesign.label || ""}
                                                width={effectiveFrontDesign.width ?? 150}
                                                height={effectiveFrontDesign.height ?? 84}
                                                className="object-contain"
                                              />
                                            </div>
                                            <div
                                              style={{
                                                ...baseStyle,
                                                position: "absolute",
                                                left: "50%",
                                                top: "50%",
                                                transform: `translate(calc(-50% + ${textOx}px), calc(-50% + ${textOy}px))`,
                                              }}
                                            >
                                              {txt}
                                            </div>
                                          </div>
                                        );
                                    }
                                  })()}
                                </div>
                              </div>
                            ) : (
                              <span
                                className="text-xl font-extrabold drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] tracking-wide text-center inline-block max-w-[90%]"
                                style={{
                                  fontFamily,
                                  fontSize: `${designFontSize + (isCookie ? 2 : 0)}px`,
                                  color: textColor,
                                  lineHeight: "1.05",
                                  textShadow: `
                                    0 1px 1px rgba(255,255,255,0.8),
                                    0 2px 2px rgba(0,0,0,0.2)
                                  `,
                                }}
                              >
                                {formatTextWithBreak(frontMessage) || "Frase anverso"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Reverso */}
                        <div
                            className={`absolute inset-0 transition-transform duration-500 backface-hidden ${
                                currentFace === 2 ? "rotate-y-0" : "-rotate-y-180"
                            }`}
                        >
                          <Image
                              src={baseImg}
                              alt="Relicario circular (reverso)"
                              fill
                              className="object-contain"
                          />

                          {/* Overlay texto reverso */}
                          <div
                              className="absolute inset-0 flex items-center justify-center"
                              style={{
                                opacity: currentFace === 2 && !isRotating ? 1 : 0,
                                transition: "opacity 0.2s ease-in-out",
                              }}
                          >
                            {effectiveBackDesign ? (
                              <div className="absolute inset-0 pointer-events-none z-10">
                                <div
                                  style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: "50%",
                                    transform: "translate(-50%, -50%)",
                                  }}
                                >
                                  {(() => {
                                    const txt = formatTextWithBreak(backMessage || effectiveBackDesign.defaultText || "");
                                    const svgOx = effectiveBackDesign.offsetX ?? 0;
                                    const svgOy = effectiveBackDesign.offsetY ?? 0;
                                    let baseSize = effectiveBackDesign.fontSize ?? designFontSize;
                                    if (isCookie) baseSize += 2;
                                    const computedFontSize =
                                      effectiveBackDesign.position === "right" ? Math.round(baseSize * 0.7) : baseSize;

                                    const isSideText = effectiveBackDesign.position === "left" || effectiveBackDesign.position === "right";

                                    const baseStyle = {
                                      fontFamily: effectiveBackDesign.fontFamily || fontFamily,
                                      color: effectiveBackDesign.color || textColor,
                                      fontSize: `${computedFontSize}px`,
                                      lineHeight: "1.05",
                                      textAlign: isSideText ? "left" : "center",
                                      width: isSideText ? undefined : (effectiveBackDesign.width ?? 150),
                                      padding:
                                        isSideText ? "0" : "0 8px",
                                    } as React.CSSProperties;
                                    const textOx = effectiveBackDesign.textOffsetX ?? 0;
                                    const textOy = effectiveBackDesign.textOffsetY ?? 0;
                                    const horizGap = -30;

                                    switch (effectiveBackDesign.position) {
                                      case "below":
                                        return (
                                          <div className="flex flex-col items-center">
                                            <div
                                              className="relative"
                                              style={{
                                                width: effectiveBackDesign.width ?? 150,
                                                height: effectiveBackDesign.height ?? 84,
                                                overflow: "hidden",
                                                transform: `translate(${svgOx}px, ${svgOy}px)`,
                                              }}
                                            >
                                              <Image
                                                src={effectiveBackDesign.path}
                                                alt={effectiveBackDesign.label || ""}
                                                width={effectiveBackDesign.width ?? 150}
                                                height={effectiveBackDesign.height ?? 84}
                                                className="object-contain"
                                              />
                                            </div>
                                            <div style={{ ...baseStyle, marginTop: textOy, transform: `translateX(${textOx}px)` }}>{txt}</div>
                                          </div>
                                        );
                                      case "above":
                                        return (
                                          <div className="flex flex-col items-center">
                                            <div style={{ ...baseStyle, marginBottom: textOy, transform: `translateX(${textOx}px)` }}>{txt}</div>
                                            <div
                                              className="relative"
                                              style={{
                                                width: effectiveBackDesign.width ?? 150,
                                                height: effectiveBackDesign.height ?? 84,
                                                overflow: "hidden",
                                                transform: `translate(${svgOx}px, ${svgOy}px)`,
                                              }}
                                            >
                                              <Image
                                                src={effectiveBackDesign.path}
                                                alt={effectiveBackDesign.label || ""}
                                                width={effectiveBackDesign.width ?? 150}
                                                height={effectiveBackDesign.height ?? 84}
                                                className="object-contain"
                                              />
                                            </div>
                                          </div>
                                        );
                                      case "left":
                                        return (
                                          <div className="flex items-center">
                                            <div style={{ ...baseStyle, marginRight: horizGap, transform: `translate(${textOx}px, ${textOy}px)` }}>{txt}</div>
                                            <div
                                              className="relative"
                                              style={{
                                                width: effectiveBackDesign.width ?? 150,
                                                height: effectiveBackDesign.height ?? 84,
                                                overflow: "hidden",
                                                transform: `translate(${svgOx}px, ${svgOy}px)`,
                                              }}
                                            >
                                              <Image
                                                src={effectiveBackDesign.path}
                                                alt={effectiveBackDesign.label || ""}
                                                width={effectiveBackDesign.width ?? 150}
                                                height={effectiveBackDesign.height ?? 84}
                                                className="object-contain"
                                              />
                                            </div>
                                          </div>
                                        );
                                      case "right":
                                        return (
                                          <div className="flex items-center">
                                            <div
                                              className="relative"
                                              style={{
                                                width: effectiveBackDesign.width ?? 150,
                                                height: effectiveBackDesign.height ?? 84,
                                                overflow: "hidden",
                                                transform: `translate(${svgOx}px, ${svgOy}px)`,
                                              }}
                                            >
                                              <Image
                                                src={effectiveBackDesign.path}
                                                alt={effectiveBackDesign.label || ""}
                                                width={effectiveBackDesign.width ?? 150}
                                                height={effectiveBackDesign.height ?? 84}
                                                className="object-contain"
                                              />
                                            </div>
                                            <div style={{ ...baseStyle, marginLeft: horizGap, transform: `translate(${textOx}px, ${textOy}px)` }}>{txt}</div>
                                          </div>
                                        );
                                      case "center":
                                      default:
                                        return (
                                          <div
                                            className="relative"
                                            style={{
                                              width: effectiveBackDesign.width ?? 150,
                                              height: effectiveBackDesign.height ?? 84,
                                              overflow: "visible",
                                            }}
                                          >
                                            <div
                                              className="relative"
                                              style={{
                                                width: effectiveBackDesign.width ?? 150,
                                                height: effectiveBackDesign.height ?? 84,
                                                overflow: "hidden",
                                                transform: `translate(${svgOx}px, ${svgOy}px)`,
                                              }}
                                            >
                                              <Image
                                                src={effectiveBackDesign.path}
                                                alt={effectiveBackDesign.label || ""}
                                                width={effectiveBackDesign.width ?? 150}
                                                height={effectiveBackDesign.height ?? 84}
                                                className="object-contain"
                                              />
                                            </div>
                                            <div
                                              style={{
                                                ...baseStyle,
                                                position: "absolute",
                                                left: "50%",
                                                top: "50%",
                                                transform: `translate(calc(-50% + ${textOx}px), calc(-50% + ${textOy}px))`,
                                              }}
                                            >
                                              {txt}
                                            </div>
                                          </div>
                                        );
                                    }
                                  })()}
                                </div>
                              </div>
                            ) : (
                              <span
                                className="text-xl font-extrabold drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] tracking-wide text-center inline-block max-w-[90%]"
                                style={{
                                  fontFamily,
                                  fontSize: `${designFontSize + (isCookie ? 2 : 0)}px`,
                                  color: textColor,
                                  lineHeight: "1.05",
                                  textShadow: `
                                    0 1px 1px rgba(255,255,255,0.8),
                                    0 2px 2px rgba(0,0,0,0.2)
                                  `,
                                }}
                              >
                                {formatTextWithBreak(backMessage) || "Frase reverso"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botones de control: Rotar y Cambiar color */}
                    <div className="flex justify-center mb-4 lg:mb-6 space-x-4">
                      <button
                          onClick={handleRotate}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {currentFace === 1 ? "Ver reverso" : "Ver anverso"}
                        </span>
                      </button>

                      <button
                          onClick={toggleVariant}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                      >
                        Color: {selectedVariant?.name ?? "Cargando..."}
                      </button>
                    </div>

                    {/* Campo de texto dinámico según cara */}
                    <div className="space-y-4 mb-4">
                      <div>
                        <label htmlFor="relicario-input" className="sr-only">
                          {currentFace === 1 ? "Frase del anverso" : "Frase del reverso"}
                        </label>
                        <input
                          id="relicario-input"
                          type="text"
                          value={currentFace === 1 ? frontMessage : backMessage}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            const limit = effectiveDesign?.maxChars ?? MAX_CHARS;
                            if (newValue.length <= limit) {
                              if (currentFace === 1) {
                                setFrontMessage(newValue);
                              } else {
                                setBackMessage(newValue);
                              }
                            }
                          }}
                          placeholder={currentFace === 1 ? "Frase del anverso" : "Frase del reverso"}
                          maxLength={effectiveDesign?.maxChars ?? MAX_CHARS}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-sm font-semibold tracking-wide"
                        />
                        <p
                          className={`text-xs mt-1 text-center ${
                            (currentFace === 1 ? frontMessage.length : backMessage.length) >= (effectiveDesign?.maxChars ?? MAX_CHARS)
                              ? "text-red-500"
                              : "text-gray-500"
                          }`}
                        >
                          {currentFace === 1
                            ? `${frontMessage.length}/${effectiveDesign?.maxChars ?? MAX_CHARS} caracteres`
                            : `${backMessage.length}/${effectiveDesign?.maxChars ?? MAX_CHARS} caracteres`}
                        </p>
                      </div>
                    </div>

                    {/* Font selector */}
                    <div className="mb-4 flex justify-center">
                      <select
                          value={fontFamily}
                          onChange={(e) => {
                            const newFont = e.target.value;
                            setFontFamily(newFont);
                            if (typeof window !== "undefined") {
                              localStorage.setItem("relicarioCirc_fontFamily", newFont);
                            }
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                      >
                        <option value={cookieFont.style.fontFamily}>Cookie (dulce / manuscrita)</option>
                        <option value={courgetteFont.style.fontFamily}>Courgette (caligráfica)</option>
                        <option value="Georgia, 'Times New Roman', serif">Georgia (clásica)</option>
                        <option value="'Lucida Calligraphy', 'Lucida Handwriting', cursive">
                          Lucida Calligraphy (elegante)
                        </option>
                      </select>
                    </div>

                    {/* Image Upload */}
                    <div className="pb-4">
                      <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                          Sube hasta 2 fotos para añadir al relicario.
                        </h3>
                        <div className="flex items-center space-x-4">
                          <input
                            type="file"
                            accept="image/*"
                            disabled={images.length >= MAX_IMAGES}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (images.length >= MAX_IMAGES) {
                                alert("Máximo 2 fotos");
                                return;
                              }
                              setImages([...images, file]);
                            }}
                            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* Thumbnails */}
                        {images.length > 0 && (
                          <div className="mt-4 flex gap-4">
                            {images.map((img, i) => (
                              <div
                                key={i}
                                className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-lg overflow-hidden"
                              >
                                <Image
                                  src={URL.createObjectURL(img)}
                                  alt={`Imagen cargada ${i + 1}`}
                                  fill
                                  className="object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                                  className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"
                                >
                                  <X className="h-3 w-3 text-gray-600" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    </div>{/* Fin columna izquierda */}

                    {/* COLUMNA DERECHA: Solo diseños */}
                    <div className="flex flex-col space-y-4">
                    {/* Selector de diseño */}
                    <div className="mb-4">
                      <div className="border-t lg:border-t-0 border-gray-200 pt-4 lg:pt-0">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-medium text-gray-900">Elige un diseño</h3>
                          {effectiveDesign ? (
                            <button
                              type="button"
                              onClick={() => chooseDesign(null)}
                              className="text-xs text-gray-600 hover:text-gray-900 underline"
                            >
                              Quitar diseño
                            </button>
                          ) : null}
                        </div>

                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <button
                            type="button"
                            onClick={() => chooseDesign(null)}
                            className={`rounded-lg border p-3 text-left hover:shadow-sm transition bg-white ${
                              !effectiveDesign ? "border-gray-900" : "border-gray-200"
                            }`}
                            aria-pressed={!effectiveDesign}
                          >
                            <div className="text-sm font-semibold text-gray-900">Sin diseño</div>
                            <div className="text-xs text-gray-500 mt-1">Solo texto</div>
                          </button>

                          {RELICARIO_PRESET_DESIGNS.map((d) => {
                            const selected = effectiveDesign?.path === d.path;
                            return (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => chooseDesign(d)}
                                className={`rounded-lg border p-2 hover:shadow-sm transition bg-white ${
                                  selected ? "border-gray-900" : "border-gray-200"
                                }`}
                                aria-pressed={selected}
                              >
                                <div className="flex items-center justify-center">
                                  <Image
                                    src={d.path}
                                    alt={d.label || d.id}
                                    width={d.width ?? 150}
                                    height={d.height ?? 84}
                                    className="object-contain"
                                  />
                                </div>
                                <div className="text-xs text-center mt-2 text-gray-700">{d.label || d.id}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Editor de diseño (solo para admin) */}
                    {designEditorEnabled && effectiveDesign ? (
                      <div className="mb-4">
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                Ajuste de diseño {currentFace === 1 ? "(Anverso)" : "(Reverso)"}
                              </div>
                              <div className="text-xs text-gray-600">Solo visible con NEXT_PUBLIC_RELICARIO_DESIGN_EDITOR=true</div>
                            </div>
                            <button
                              type="button"
                              className="text-xs underline text-gray-700 hover:text-gray-900"
                              onClick={async () => {
                                const json = JSON.stringify(effectiveDesign, null, 2);
                                try {
                                  await navigator.clipboard.writeText(json);
                                  alert("Config copiada al portapapeles.");
                                } catch {
                                  alert(json);
                                }
                              }}
                            >
                              Copiar JSON
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <label className="text-xs text-gray-700">
                              width
                              <input
                                type="number"
                                value={effectiveDesign.width ?? 150}
                                onChange={(e) => updateSelectedDesignConfig({ width: Number(e.target.value) })}
                                className="mt-1 w-full px-2 py-1 border rounded bg-white"
                              />
                            </label>
                            <label className="text-xs text-gray-700">
                              height
                              <input
                                type="number"
                                value={effectiveDesign.height ?? 84}
                                onChange={(e) => updateSelectedDesignConfig({ height: Number(e.target.value) })}
                                className="mt-1 w-full px-2 py-1 border rounded bg-white"
                              />
                            </label>
                            <label className="text-xs text-gray-700">
                              offsetX (SVG)
                              <input
                                type="number"
                                value={effectiveDesign.offsetX ?? 0}
                                onChange={(e) => updateSelectedDesignConfig({ offsetX: Number(e.target.value) })}
                                className="mt-1 w-full px-2 py-1 border rounded bg-white"
                              />
                            </label>
                            <label className="text-xs text-gray-700">
                              offsetY (SVG)
                              <input
                                type="number"
                                value={effectiveDesign.offsetY ?? 0}
                                onChange={(e) => updateSelectedDesignConfig({ offsetY: Number(e.target.value) })}
                                className="mt-1 w-full px-2 py-1 border rounded bg-white"
                              />
                            </label>
                            <label className="text-xs text-gray-700">
                              textOffsetX
                              <input
                                type="number"
                                value={effectiveDesign.textOffsetX ?? 0}
                                onChange={(e) => updateSelectedDesignConfig({ textOffsetX: Number(e.target.value) })}
                                className="mt-1 w-full px-2 py-1 border rounded bg-white"
                              />
                            </label>
                            <label className="text-xs text-gray-700">
                              textOffsetY
                              <input
                                type="number"
                                value={effectiveDesign.textOffsetY ?? 0}
                                onChange={(e) => updateSelectedDesignConfig({ textOffsetY: Number(e.target.value) })}
                                className="mt-1 w-full px-2 py-1 border rounded bg-white"
                              />
                            </label>
                            <label className="text-xs text-gray-700">
                              fontSize
                              <input
                                type="number"
                                value={effectiveDesign.fontSize ?? designFontSize}
                                onChange={(e) => updateSelectedDesignConfig({ fontSize: Number(e.target.value) })}
                                className="mt-1 w-full px-2 py-1 border rounded bg-white"
                              />
                            </label>
                            <label className="text-xs text-gray-700">
                              maxChars
                              <input
                                type="number"
                                value={effectiveDesign.maxChars ?? 15}
                                onChange={(e) => updateSelectedDesignConfig({ maxChars: Number(e.target.value) })}
                                className="mt-1 w-full px-2 py-1 border rounded bg-white"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    </div>{/* Fin columna derecha */}
                  </div>/* Fin grid */
              )}

              {/* STEP 2 */}
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
