'use client';

import { Dialog, DialogContent, DialogTrigger, DialogTitle, VisuallyHidden } from "@/components/ui/dialog";
import { X, RotateCcw } from "lucide-react";
import { useState, useEffect, type ChangeEvent, type ReactNode } from "react";

import Image from "next/image";
import { Cookie, Courgette } from "next/font/google";
import { RELICARIO_PRESET_DESIGNS, type RelicarioPresetDesign as PresetDesign } from "@/lib/relicarios/preset-designs";
import { createClient } from "@supabase/supabase-js";
import { CustomerForm, CustomerData } from "@/components/checkout/CustomerForm";
import { validateImageFile } from "@/lib/utils";


const cookie = Cookie({ subsets: ["latin"], weight: "400" });
const courgette = Courgette({ subsets: ["latin"], weight: "400" });

interface RelicarioCustomProps {
  product: {
    id: string;
    title: string;
    price: number;
    img?: string;
  };
  children: ReactNode;
}

type ProductVariant = {
  id: number;
  name: string;
  color: string | null;
  price_override: number | null;
  img: string | null;
};

export function RelicarioCustom({ product, children }: RelicarioCustomProps) {
  // Variantes
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [imageUrls, setImageUrls] = useState({ gold: "", silver: "" });


  // texto / estilo
  const [fontFamily, setFontFamily] = useState(cookie.style.fontFamily);
  const isCookie = fontFamily === cookie.style.fontFamily;

  const [petName, setPetName] = useState("");
  const [ownerInfo, setOwnerInfo] = useState("");

  const [variant, setVariant] = useState<"gold" | "silver">("gold");
  const [currentFace, setCurrentFace] = useState<1 | 2>(1);
  const [isRotating, setIsRotating] = useState(false);

  // fotos (máx. 2)
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [photosForCheckout, setPhotosForCheckout] = useState<
    { storagePath: string; publicUrl: string; position: number }[]
  >([]);

  // flujo de checkout
  const [step, setStep] = useState<1 | 2>(1);
  const [isPaying, setIsPaying] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: "",
    phone: "",
    email: "",
    address: "",
    neighborhood: "",
    locality: "",
  });
  const [textColor, setTextColor] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("petTag_textColor") || "#3b3b3b";
    }
    return "#3b3b3b";
  });

  const [designFontSize, setDesignFontSize] = useState(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("petTag_fontSize")) || 20;
    }
    return 20;
  });

  const PRESET_DESIGNS = RELICARIO_PRESET_DESIGNS;

  const designEditorEnabled = process.env.NEXT_PUBLIC_RELICARIO_DESIGN_EDITOR === "true";

  // Diseño para el frente (anverso)
  const [frontDesignConfig, setFrontDesignConfig] = useState<PresetDesign | null>(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("petTag_design_front");
      if (raw) {
        try {
          return JSON.parse(raw) as PresetDesign;
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  // Diseño para el reverso
  const [backDesignConfig, setBackDesignConfig] = useState<PresetDesign | null>(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("petTag_design_back");
      if (raw) {
        try {
          return JSON.parse(raw) as PresetDesign;
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  // Diseño efectivo según la cara actual
  const effectiveDesign = currentFace === 1 ? frontDesignConfig : backDesignConfig;
  const effectiveFrontDesign = frontDesignConfig;
  const effectiveBackDesign = backDesignConfig;

  const chooseDesign = (design: PresetDesign | null) => {
    const nextDesign = design ? ({ ...design } as PresetDesign) : null;
    const storageKey = currentFace === 1 ? "petTag_design_front" : "petTag_design_back";
    
    if (currentFace === 1) {
      setFrontDesignConfig(nextDesign);
    } else {
      setBackDesignConfig(nextDesign);
    }

    if (typeof window !== "undefined") {
      if (nextDesign) {
        localStorage.setItem(storageKey, JSON.stringify(nextDesign));

        // Aplicar texto por defecto solo si el campo está vacío
        if (currentFace === 1 && !petName && nextDesign.defaultText) {
          setPetName(nextDesign.defaultText);
          localStorage.setItem("petTag_petName", nextDesign.defaultText);
        } else if (currentFace === 2 && !ownerInfo && nextDesign.defaultText) {
          setOwnerInfo(nextDesign.defaultText);
          localStorage.setItem("petTag_ownerInfo", nextDesign.defaultText);
        }
        if (nextDesign.fontFamily) {
          setFontFamily(nextDesign.fontFamily);
          localStorage.setItem("petTag_fontFamily", nextDesign.fontFamily);
        }
        if (nextDesign.color) {
          setTextColor(nextDesign.color);
          localStorage.setItem("petTag_textColor", nextDesign.color);
        }
        if (nextDesign.fontSize) {
          setDesignFontSize(nextDesign.fontSize);
          localStorage.setItem("petTag_fontSize", String(nextDesign.fontSize));
        }
      } else {
        localStorage.removeItem(storageKey);
      }
    }
  };

  const updateSelectedDesignConfig = (patch: Partial<PresetDesign>) => {
    const storageKey = currentFace === 1 ? "petTag_design_front" : "petTag_design_back";
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

  // ---- lógica de checkout / supabase (rama fix/general-items) ----
  const isCustomerFormValid =
    customerData.name.trim().length > 2 &&
    customerData.phone.trim().length >= 7 &&
    customerData.address.trim().length > 5 &&
    customerData.locality.trim().length > 2;

  const nf = new Intl.NumberFormat("es-CO");
  const unitPrice = selectedVariant?.price_override ?? product.price;
  const total = unitPrice;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    setFontFamily(localStorage.getItem("petTag_fontFamily") || cookie.style.fontFamily);
    setPetName(localStorage.getItem("petTag_petName") || "");
    setOwnerInfo(localStorage.getItem("petTag_ownerInfo") || "");
    setVariant((localStorage.getItem("petTag_variant") as "gold" | "silver") || "gold");
  }, []);

  useEffect(() => {
    const { data: goldData } = supabase.storage
      .from("relicarios-images")
      .getPublicUrl("relicario-gold.png");

    const { data: silverData } = supabase.storage
      .from("relicarios-images")
      .getPublicUrl("relicario-silver.png");

    setImageUrls({
      gold: goldData?.publicUrl ?? "",
      silver: silverData?.publicUrl ?? "",
    });
  }, []);

  useEffect(() => {
    const loadVariants = async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("id, name, color, price_override, img")
        .eq("product_id", Number(product.id))
        .eq("active", true);

      if (error) {
        console.error("Error cargando variantes de relicario:", error);
        return;
      }

      const typed = (data || []) as ProductVariant[];
      setVariants(typed);

      const current =
        typed.find(
          (v) =>
            v.color?.toLowerCase() === variant ||
            v.name.toLowerCase().includes(variant)
        ) || typed[0] || null;

      setSelectedVariant(current);
    };

    loadVariants();
  }, [product.id]);
  
  const handleRotate = () => {
    setIsRotating(true);
    setTimeout(() => {
      setCurrentFace((prev) => (prev === 1 ? 2 : 1));
      setIsRotating(false);
    }, 250);
  };

  const toggleVariant = () => {
    const next: "gold" | "silver" = variant === "gold" ? "silver" : "gold";
    setVariant(next);

    if (typeof window !== "undefined") {
      localStorage.setItem("petTag_variant", next);
    }

    if (variants.length > 0) {
      const found =
        variants.find(
          (v) =>
            v.color?.toLowerCase() === next ||
            v.name.toLowerCase().includes(next)
        ) || variants[0];

      setSelectedVariant(found);
    }
  };

  const formatTextWithBreak = (text: string): ReactNode => {
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

  const BUCKET_NAME = "relicario-uploads";

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 2 - uploadedImages.length;
    if (remainingSlots <= 0) {
      alert("Solo puedes subir hasta 2 fotos para el relicario.");
      return;
    }

    const filesArray = Array.from(files).slice(0, remainingSlots);

    for (const file of filesArray) {
      try {
        // Validar tipo MIME y tamaño
        const validation = validateImageFile(file);
        if (!validation.valid) {
          alert(validation.error);
          continue;
        }

        const ext = file.name.split(".").pop() || "jpg";
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const storagePath = `tmp/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Error subiendo imagen del relicario:", uploadError);
          alert("No se pudo subir una de las fotos. Intenta de nuevo.");
          continue;
        }

        const { data } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(storagePath);

        const publicUrl = data.publicUrl;

        setUploadedImages((prev) => [...prev, publicUrl]);

        setPhotosForCheckout((prev) => {
          const nextPosition = prev.length + 1; // 1 o 2
          return [
            ...prev,
            {
              storagePath,
              publicUrl,
              position: nextPosition,
            },
          ];
        });
      } catch (err) {
        console.error("Error general subiendo imagen:", err);
        alert("Ocurrió un error subiendo la foto.");
      }
    }

    event.target.value = "";
  };

  const handlePay = async () => {
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
              productVariantId: selectedVariant?.id ?? null,
              quantity: 1,
              unitPrice: unitPrice,
              title: selectedVariant
                ? `${product.title} - ${selectedVariant.name}`
                : product.title,
              personalizationFront: petName || null,
              personalizationBack: ownerInfo || null,
              photos: photosForCheckout,
              engravingFont: getSelectedFontForDb(),
              relicarioDesignId: effectiveDesign?.id ?? null,
              relicarioDesignPath: effectiveDesign?.path ?? null,
            },
          ],

        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Error desde /api/checkout (relicario):", data);
        alert(data.error || "No se pudo iniciar el pago.");
        return;
      }

      if (!data.order_id || !data.access_token) {
        console.error("Respuesta sin order_id o access_token (relicario):", data);
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
      console.error("Error en handlePay (relicario):", error);
      alert("Error al procesar tu pedido.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

<DialogContent className="sm:max-w-5xl lg:max-w-6xl w-full max-h-[90vh] p-0 bg-transparent border-none">
        <VisuallyHidden>
          <DialogTitle>Personaliza tu relicario corazón</DialogTitle>
        </VisuallyHidden>
        <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          {/* botón cerrar */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-4 z-20 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>

          {/* HEADER DEL MODAL (layout del redesign + lógica de MP) */}
          <div className="bg-white border-b">
            <div className="px-4 md:px-6 py-3 md:py-4 pr-12 md:pr-16">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <h1 className="text-base md:text-xl font-bold text-zinc-900">
                  Personaliza tu relicario corazón
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

          {/* CONTENIDO */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-10 pt-6">
            {step === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* COLUMNA IZQUIERDA: Preview del relicario */}
                <div className="flex flex-col">
                {/* Preview del relicario */}
                <div className="flex justify-center mb-4 lg:mb-6">
                  <div
                    className="relative w-full max-w-[520px] h-[280px] lg:h-[320px] perspective-1000"
                    style={{ transformStyle: "preserve-3d" }}
                  >
  {/* Frente */}
  <div
    className={`absolute inset-0 transition-transform duration-500 backface-hidden ${
      currentFace === 1 ? "rotate-y-0" : "rotate-y-180"
    }`}
  >
    <Image
      src={variant === "silver" ? imageUrls.silver : imageUrls.gold}
      alt="Relicario (frente)"
      fill
      className="object-contain"
    />

    {/* Texto / diseño sobre el frente */}
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
              const txt = formatTextWithBreak(petName || effectiveFrontDesign.defaultText || "");
              const svgOx = effectiveFrontDesign.offsetX ?? 0;
              const svgOy = effectiveFrontDesign.offsetY ?? 0;
              let baseSize = effectiveFrontDesign.fontSize ?? designFontSize;
              if (isCookie) {
                baseSize += 2;
              }
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
          className="text-xl font-extrabold text-[#3b3b3b] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] tracking-wide text-center inline-block max-w-[90%]"
          style={{
            fontFamily,
            textShadow: `
              0 1px 1px rgba(255,255,255,0.8),
              0 2px 2px rgba(0,0,0,0.2)
            `,
            fontSize: `${designFontSize + (isCookie ? 2 : 0)}px`,
            color: textColor,
            lineHeight: "1.05",
          }}
        >
          {formatTextWithBreak(petName)}
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
      src={variant === "silver" ? imageUrls.silver : imageUrls.gold}
      alt="Relicario (reverso)"
      fill
      className="object-contain"
    />

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
              const txt = formatTextWithBreak(ownerInfo || effectiveBackDesign.defaultText || "");
              const svgOx = effectiveBackDesign.offsetX ?? 0;
              const svgOy = effectiveBackDesign.offsetY ?? 0;
              let baseSize = effectiveBackDesign.fontSize ?? designFontSize;
              if (isCookie) {
                baseSize += 2;
              }
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
          className="text-xl font-extrabold text-[#3b3b3b] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] tracking-wide text-center inline-block max-w-[90%]"
          style={{
            fontFamily,
            textShadow: `
              0 1px 1px rgba(255,255,255,0.8),
              0 2px 2px rgba(0,0,0,0.2)
            `,
          }}
        >
          {formatTextWithBreak(ownerInfo)}
        </span>
      )}
    </div>
  </div>

                  </div>
                </div>

{/* Botones de control */}
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
    {variant === "gold" ? "Cambiar a Silver" : "Cambiar a Gold"}
  </button>
</div>

{/* Inputs de texto */}
<div className="space-y-4 mb-4">
  <div>
    <label htmlFor="tag-input" className="sr-only">
      {currentFace === 1 ? "Nombre de la mascota" : "Información del dueño"}
    </label>
    <input
      id="tag-input"
      type="text"
      value={currentFace === 1 ? petName : ownerInfo}
      onChange={(e) => {
        const newValue = e.target.value;
        const limit = effectiveDesign?.maxChars ?? 15;
        if (newValue.length <= limit) {
          if (currentFace === 1) {
            setPetName(newValue);
            if (typeof window !== "undefined") {
              localStorage.setItem("petTag_petName", newValue);
            }
          } else {
            setOwnerInfo(newValue);
            if (typeof window !== "undefined") {
              localStorage.setItem("petTag_ownerInfo", newValue);
            }
          }
        }
      }}
      placeholder={
        currentFace === 1
          ? "Nombre de la mascota"
          : "Info. de contacto del dueño"
      }
      maxLength={effectiveDesign?.maxChars ?? 15}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-sm font-semibold tracking-wide"
    />
    <p
      className={`text-xs mt-1 text-center ${
        (currentFace === 1 ? petName.length : ownerInfo.length) >=
        (effectiveDesign?.maxChars ?? 15)
          ? "text-red-500"
          : "text-gray-500"
      }`}
    >
      {currentFace === 1
        ? `${petName.length}/${effectiveDesign?.maxChars ?? 15} caracteres`
        : `${ownerInfo.length}/${effectiveDesign?.maxChars ?? 15} caracteres`}
    </p>
  </div>
</div>

                {/* Selector de fuente */}
                <div className="mb-4 flex justify-center">
                  <select
                      value={fontFamily}
                      onChange={(e) => {
                        const newFont = e.target.value;
                        setFontFamily(newFont);
                        if (typeof window !== "undefined") {
                          localStorage.setItem("petTag_fontFamily", newFont);
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

{/* Upload de imágenes */}
<div className="pb-4">
  <div className="border-t border-gray-200 pt-4">
    <h3 className="text-sm font-medium text-gray-900 mb-2">
      Sube hasta 2 fotos para añadir al relicario.
    </h3>
    <div className="flex items-center space-x-4">
      <input
        type="file"
        accept="image/*"
        multiple
        disabled={uploadedImages.length >= 2}
        onChange={handleImageUpload}
        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>

    {uploadedImages.length > 0 && (
      <div className="mt-4 flex gap-4">
        {uploadedImages.map((img, index) => (
          <div
            key={index}
            className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-lg overflow-hidden"
          >
            <Image
              src={img}
              alt={`Imagen cargada ${index + 1}`}
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setUploadedImages((prev) => prev.filter((_, i) => i !== index));
                setPhotosForCheckout((prev) => {
                  const filtered = prev.filter((_, i) => i !== index);
                  return filtered.map((p, idx) => ({
                    ...p,
                    position: idx + 1,
                  }));
                });
              }}
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

      {PRESET_DESIGNS.map((d) => {
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
            <div className="text-xs text-center mt-2 text-gray-700">
              {d.label || d.id}
            </div>
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
          <div className="text-sm font-semibold text-gray-900">Ajuste de diseño ({currentFace === 1 ? "Anverso" : "Reverso"})</div>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
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

            {step === 2 && (
              <div className="max-w-md mx-auto">
                <CustomerForm data={customerData} onChange={setCustomerData} />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
