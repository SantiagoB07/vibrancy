'use client';

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { Cookie, Courgette } from "next/font/google";

import { CustomerForm, CustomerData } from "@/components/checkout/CustomerForm";

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
  const [message, setMessage] = useState("");
  const [fontFamily, setFontFamily] = useState(cookieFont.style.fontFamily);

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
  // Upload to Supabase
  // ===========================
  const uploadPhoto = async (file: File, position: number) => {
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
      let photosForCheckout = [];

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
              personalizationFront: message || null,
              personalizationBack: null,
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

      window.location.href = data.init_point;
    } catch (err) {
      console.error(err);
      alert("No se pudo procesar el pago.");
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

        <DialogContent className="sm:max-w-3xl w-full max-h-[90vh] p-0 bg-transparent border-none">
          <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

            {/* Close button */}
            <button
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 z-20 bg-white rounded-full p-2 shadow-md hover:shadow-lg"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            {/* HEADER */}
            <div className="border-b p-4 px-6 flex items-center justify-between">
              <h1 className="text-lg md:text-xl font-bold">Personaliza tu relicario circular</h1>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-xl font-bold">${nf.format(total)}</p>
                </div>

                <button
                    onClick={() => {
                      if (step === 1) {
                        setStep(2);
                        return;
                      }
                      handlePay();
                    }}
                    disabled={step === 2 && !isCustomerFormValid}
                    className="bg-black text-white px-6 py-2 rounded-full disabled:opacity-60"
                >
                  {step === 1 ? "Continuar" : isPaying ? "Procesando..." : "Confirmar y pagar"}
                </button>
              </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-8">

              {/* STEP 1 */}
              {step === 1 && (
                  <>
                    {/* Base relicario */}
                    <div className="w-full flex justify-center mb-6">
                      <Image
                          src={baseImg}
                          alt="Relicario circular"
                          width={300}
                          height={300}
                          className="object-contain"
                      />
                    </div>

                    {/* Variant selector */}
                    <div className="flex justify-center mb-6">
                      <button
                          onClick={toggleVariant}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                      >
                        Color: {selectedVariant?.name ?? "Cargando..."}
                      </button>
                    </div>

                    {/* Message */}
                    <div className="max-w-md mx-auto mb-6">
                      <label className="block text-sm font-medium mb-1">Frase del relicario</label>
                      <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value.slice(0, 100))}
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg p-3"
                          placeholder="Escribe una frase..."
                      />
                      <p className="text-xs text-gray-500 mt-1">{message.length}/100 caracteres</p>
                    </div>

                    {/* Font selector */}
                    <div className="flex justify-center mb-6">
                      <select
                          value={fontFamily}
                          onChange={(e) => setFontFamily(e.target.value)}
                          className="border px-3 py-2 rounded-lg"
                      >
                        <option value={cookieFont.style.fontFamily}>Cookie</option>
                        <option value={courgetteFont.style.fontFamily}>Courgette</option>
                        <option value="Georgia, 'Times New Roman', serif">Georgia</option>
                        <option value="'Lucida Calligraphy', 'Lucida Handwriting', cursive">
                          Lucida Calligraphy
                        </option>
                      </select>
                    </div>

                    {/* Image Upload */}
                    <div className="max-w-md mx-auto">
                      <label className="block text-sm font-medium mb-2">Fotos (máx. 2)</label>

                      <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (images.length >= MAX_IMAGES) {
                              alert("Máximo 2 fotos");
                              return;
                            }
                            setImages([...images, file]);
                          }}
                      />

                      {/* Thumbnails */}
                      <div className="flex gap-4 mt-4">
                        {images.map((img, i) => (
                            <div key={i} className="relative">
                              <Image
                                  src={URL.createObjectURL(img)}
                                  alt="Foto subida"
                                  width={80}
                                  height={80}
                                  className="rounded-lg object-cover"
                              />

                              <button
                                  onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs"
                              >
                                X
                              </button>
                            </div>
                        ))}
                      </div>
                    </div>
                  </>
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
