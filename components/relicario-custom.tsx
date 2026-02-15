'use client';

import { Dialog, DialogContent, DialogTrigger, DialogTitle, VisuallyHidden } from "@/components/ui/dialog";
import { X, RotateCcw, ShoppingCart, ArrowLeft } from "lucide-react";
import { useState, useEffect, type ChangeEvent, type ReactNode } from "react";

import Image from "next/image";
import { Cookie, Courgette } from "next/font/google";
import { createClient } from "@supabase/supabase-js";
import { CustomerForm, CustomerData } from "@/components/checkout/CustomerForm";
import { validateImageFile } from "@/lib/utils";
import { AIPhraseModal } from "@/components/ai/ai-phrase-modal";
import { addToCart } from "@/lib/local-cart";
import { toast } from "sonner";


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

  // ---- lógica de checkout / supabase (rama fix/general-items) ----
  const isCustomerFormValid =
    customerData.name.trim().length > 2 &&
    customerData.phone.trim().length >= 7 &&
    customerData.address.trim().length > 5 &&
    customerData.locality.trim().length > 2;

const nf = new Intl.NumberFormat("es-CO");
  const unitPrice = selectedVariant?.price_override ?? product.price;
  const total = unitPrice;

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
    addToCart({
      productId: Number(product.id),
      productVariantId: selectedVariant?.id ?? null,
      variantName: selectedVariant?.name,
      quantity: 1,
      title: selectedVariant
        ? `${product.title} - ${selectedVariant.name}`
        : product.title,
      unitPrice: unitPrice,
      personalizationFront: petName || null,
      personalizationBack: ownerInfo || null,
      engravingFont: getSelectedFontForDb(),
      productImage: product.img || imageUrls.gold || undefined,
    });

    toast.success("Producto agregado al carrito", {
      description: selectedVariant
        ? `${product.title} - ${selectedVariant.name}`
        : product.title,
    });

    setIsOpen(false);
  };

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

<DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl w-full max-h-[90vh] p-0 bg-transparent border-none">
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
          <div className="bg-white border-b px-4 py-3 flex items-center justify-between pr-14">
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
                Personaliza tu relicario corazón
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-zinc-900">${nf.format(total)}</p>
              {step === 1 && (
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant && variants.length > 0}
                  className="flex items-center gap-1.5 bg-zinc-100 text-zinc-800 px-3 py-2 rounded-full font-medium hover:bg-zinc-200 disabled:opacity-60 disabled:cursor-not-allowed transition text-sm"
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
                disabled={
                  (!selectedVariant && variants.length > 0) ||
                  (step === 2 && (!isCustomerFormValid || isPaying))
                }
                className="bg-[#5E3A1E] text-white px-4 py-2 rounded-full font-medium hover:bg-[#4C2F18] disabled:opacity-60 disabled:cursor-not-allowed transition text-sm"
              >
                {step === 1
                  ? "Comprar ahora"
                  : isPaying
                  ? "Procesando..."
                  : "Continuar al pago"}
              </button>
            </div>
          </div>

          {/* CONTENIDO */}
          <div className="flex-1 overflow-y-auto p-6">
            {step === 1 && (
              <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                {/* Columna izquierda: Preview del relicario */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div
                    className="relative w-[320px] h-[180px] md:w-[360px] md:h-[200px] perspective-1000"
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

    {/* Texto sobre el frente */}
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        opacity: currentFace === 1 && !isRotating ? 1 : 0,
        transition: "opacity 0.2s ease-in-out",
      }}
    >
      <span
        className="text-xl font-extrabold text-[#3b3b3b] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] tracking-wide text-center inline-block max-w-[90%]"
        style={{
          fontFamily,
          textShadow: `
            0 1px 1px rgba(255,255,255,0.8),
            0 2px 2px rgba(0,0,0,0.2)
          `,
          fontSize: `${20 + (isCookie ? 2 : 0)}px`,
        }}
      >
        {formatTextWithBreak(petName)}
      </span>
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
      <span
        className="text-xl font-extrabold text-[#3b3b3b] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] tracking-wide text-center inline-block max-w-[90%]"
        style={{
          fontFamily,
          textShadow: `
            0 1px 1px rgba(255,255,255,0.8),
            0 2px 2px rgba(0,0,0,0.2)
          `,
          fontSize: `${20 + (isCookie ? 2 : 0)}px`,
        }}
      >
        {formatTextWithBreak(ownerInfo)}
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
                        {currentFace === 1 ? "Ver reverso" : "Ver anverso"}
                      </span>
                    </button>

                    {/* Mini paleta de colores */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                      <span className="text-sm text-gray-600">Color:</span>
                      {variants.map((v) => {
                        const isGoldVariant = v.color?.toLowerCase() === "gold" || v.name.toLowerCase().includes("gold");
                        const isSelected = selectedVariant?.id === v.id;
                        const colorClass = isGoldVariant ? "bg-yellow-400" : "bg-gray-300";
                        return (
                          <button
                            key={v.id}
                            onClick={() => {
                              setSelectedVariant(v);
                              const next: "gold" | "silver" = isGoldVariant ? "gold" : "silver";
                              setVariant(next);
                              if (typeof window !== "undefined") {
                                localStorage.setItem("petTag_variant", next);
                              }
                            }}
                            className={`w-6 h-6 rounded-full ${colorClass} transition-all ${
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
                  {/* Input de texto */}
                  <div>
                    <label htmlFor="tag-input" className="block text-sm font-medium text-gray-700 mb-2">
                      {currentFace === 1 ? "Frase del anverso" : "Frase del reverso"}
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        id="tag-input"
                        type="text"
                        value={currentFace === 1 ? petName : ownerInfo}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          const limit = 15;
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
                            ? "Frase del anverso"
                            : "Frase del reverso"
                        }
                        maxLength={15}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm font-medium"
                      />
                      <AIPhraseModal
                        productType="relicario"
                        maxChars={15}
                        onSelectPhrase={(phrase) => {
                          if (currentFace === 1) {
                            setPetName(phrase);
                            if (typeof window !== "undefined") {
                              localStorage.setItem("petTag_petName", phrase);
                            }
                          } else {
                            setOwnerInfo(phrase);
                            if (typeof window !== "undefined") {
                              localStorage.setItem("petTag_ownerInfo", phrase);
                            }
                          }
                        }}
                      >
                        <span>Ideas</span>
                      </AIPhraseModal>
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        (currentFace === 1 ? petName.length : ownerInfo.length) >=
                        (15)
                          ? "text-red-500"
                          : "text-gray-500"
                      }`}
                    >
                      {currentFace === 1
                        ? `${petName.length}/${15} caracteres`
                        : `${ownerInfo.length}/${15} caracteres`}
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
                        if (typeof window !== "undefined") {
                          localStorage.setItem("petTag_fontFamily", newFont);
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

                  {/* Upload de imágenes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fotos para el relicario (máx. 2)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploadedImages.length >= 2}
                      onChange={handleImageUpload}
                      className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    />

                    {uploadedImages.length > 0 && (
                      <div className="mt-4 flex gap-4">
                        {uploadedImages.map((img, index) => (
                          <div
                            key={index}
                            className="relative w-20 h-20 rounded-lg overflow-hidden"
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
              </div>
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
