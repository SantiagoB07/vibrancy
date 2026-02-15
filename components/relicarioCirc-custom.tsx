'use client';

import { Dialog, DialogContent, DialogTrigger, DialogTitle, VisuallyHidden } from "@/components/ui/dialog";
import { X, RotateCcw, ShoppingCart, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { Cookie, Courgette } from "next/font/google";

import { CustomerForm, CustomerData } from "@/components/checkout/CustomerForm";
import { validateImageFile } from "@/lib/utils";
import { AIPhraseModal } from "@/components/ai/ai-phrase-modal";
import { addToCart } from "@/lib/local-cart";
import { toast } from "sonner";

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

  // ===========================
  // Rotation state
  // ===========================
  const [currentFace, setCurrentFace] = useState<1 | 2>(1);
  const [isRotating, setIsRotating] = useState(false);

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
  // HANDLE ADD TO CART
  // ===========================
  const handleAddToCart = () => {
    if (!selectedVariant) {
      alert("Selecciona una variante.");
      return;
    }

    addToCart({
      productId: Number(product.id),
      productVariantId: selectedVariant.id,
      variantName: selectedVariant.name,
      quantity: 1,
      title: `${product.title} - ${selectedVariant.name}`,
      unitPrice: selectedVariant.price_override ?? product.price,
      personalizationFront: frontMessage || null,
      personalizationBack: backMessage || null,
      engravingFont: getSelectedFontForDb(),
      productImage: product.img || baseImg,
    });

    toast.success("Producto agregado al carrito", {
      description: `${product.title} - ${selectedVariant.name}`,
    });

    setIsOpen(false);
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

<DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl w-full max-h-[90vh] p-0 bg-transparent border-none">
          <VisuallyHidden>
            <DialogTitle>Personaliza tu relicario circular</DialogTitle>
          </VisuallyHidden>
          <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

            {/* Close button */}
            <button
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 z-20 bg-white rounded-full p-2 shadow-md hover:shadow-lg"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            {/* HEADER */}
            <div className="border-b px-4 py-3 flex items-center justify-between pr-14">
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
                <h1 className="text-base font-bold">Personaliza tu relicario circular</h1>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">${nf.format(total)}</p>

                {step === 1 && (
                  <button
                    onClick={handleAddToCart}
                    disabled={!selectedVariant}
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
                    disabled={step === 2 && !isCustomerFormValid}
                    className="bg-[#5E3A1E] text-white px-4 py-2 rounded-full font-medium hover:bg-[#4C2F18] disabled:opacity-60 disabled:cursor-not-allowed transition text-sm"
                >
                  {step === 1 ? "Comprar ahora" : isPaying ? "Procesando..." : "Continuar al pago"}
                </button>
              </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* STEP 1 */}
              {step === 1 && (
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                  {/* Columna izquierda: Preview del relicario */}
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div
                      className="relative w-[260px] h-[260px] md:w-[280px] md:h-[280px] perspective-1000"
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
                          <span
                            className="text-xl font-extrabold text-[#3b3b3b] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] tracking-wide text-center inline-block max-w-[90%]"
                            style={{
                              fontFamily,
                              fontSize: `${20 + (isCookie ? 2 : 0)}px`,
                              color: "#3b3b3b",
                              textShadow: `
                                0 1px 1px rgba(255,255,255,0.8),
                                0 2px 2px rgba(0,0,0,0.2)
                              `,
                            }}
                          >
                            {formatTextWithBreak(frontMessage) || "Frase anverso"}
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
                          <span
                            className="text-xl font-extrabold text-[#3b3b3b] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] tracking-wide text-center inline-block max-w-[90%]"
                            style={{
                              fontFamily,
                              fontSize: `${20 + (isCookie ? 2 : 0)}px`,
                              color: "#3b3b3b",
                              textShadow: `
                                0 1px 1px rgba(255,255,255,0.8),
                                0 2px 2px rgba(0,0,0,0.2)
                              `,
                            }}
                          >
                            {formatTextWithBreak(backMessage) || "Frase reverso"}
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
                          const isGoldVariant = v.color?.toLowerCase() === "gold" || v.name.toLowerCase().includes("gold") || v.name.toLowerCase().includes("dorado");
                          const isSelected = selectedVariant?.id === v.id;
                          const colorClass = isGoldVariant ? "bg-yellow-400" : "bg-gray-300";
                          return (
                            <button
                              key={v.id}
                              onClick={() => setSelectedVariant(v)}
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
                    {/* Campo de texto dinámico según cara */}
                    <div>
                      <label htmlFor="relicario-input" className="block text-sm font-medium text-gray-700 mb-2">
                        {currentFace === 1 ? "Frase del anverso" : "Frase del reverso"}
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          id="relicario-input"
                          type="text"
                          value={currentFace === 1 ? frontMessage : backMessage}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            if (newValue.length <= MAX_CHARS) {
                              if (currentFace === 1) {
                                setFrontMessage(newValue);
                              } else {
                                setBackMessage(newValue);
                              }
                            }
                          }}
                          placeholder={currentFace === 1 ? "Frase del anverso" : "Frase del reverso"}
                          maxLength={MAX_CHARS}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm font-medium"
                        />
                        <AIPhraseModal
                          productType="relicario-circular"
                          maxChars={MAX_CHARS}
                          onSelectPhrase={(phrase) => {
                            if (currentFace === 1) {
                              setFrontMessage(phrase);
                            } else {
                              setBackMessage(phrase);
                            }
                          }}
                        >
                          <span>Ideas</span>
                        </AIPhraseModal>
                      </div>
                      <p
                        className={`text-xs mt-1 ${
                          (currentFace === 1 ? frontMessage.length : backMessage.length) >= MAX_CHARS
                            ? "text-red-500"
                            : "text-gray-500"
                        }`}
                      >
                        {currentFace === 1
                          ? `${frontMessage.length}/${MAX_CHARS} caracteres`
                          : `${backMessage.length}/${MAX_CHARS} caracteres`}
                      </p>
                    </div>

                    {/* Selector de fuente */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estilo de letra
                      </label>
                      <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fotos para el relicario (máx. 2)
                      </label>
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
                          e.target.value = "";
                        }}
                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      />

                      {/* Thumbnails */}
                      {images.length > 0 && (
                        <div className="flex gap-4 mt-4">
                          {images.map((img, i) => (
                            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden">
                              <Image
                                src={URL.createObjectURL(img)}
                                alt={`Foto ${i + 1}`}
                                fill
                                className="object-cover"
                              />
                              <button
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
                </div>
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
