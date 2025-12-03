'use client';

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { X, RotateCcw } from "lucide-react";
import { useState, useEffect, type ChangeEvent, type ReactNode } from "react";

import Image from "next/image";
import { Inter, Lobster, Coming_Soon, Pacifico, Tangerine } from 'next/font/google';
import { createClient } from "@supabase/supabase-js";
import { CustomerForm, CustomerData } from "@/components/checkout/CustomerForm";

export const inter = Inter({ subsets: ['latin'], weight: ['400', '700'] });
export const lobster = Lobster({ subsets: ['latin'], weight: ['400'] });
export const comingSoon = Coming_Soon({ subsets: ['latin'], weight: ['400'] });
export const pacifico = Pacifico({ subsets: ['latin'], weight: ['400'] });
export const tangerine = Tangerine({ subsets: ['latin'], weight: ['400', '700'] });

interface RelicarioCustomProps {
  product: {
    id: string;
    title: string;
    price: number;
    img?: string;
  };
  children: React.ReactNode;
}

type ProductVariant = {
  id: number;
  name: string;
  color: string | null;
  price_override: number | null;
  img: string | null;
};


export function RelicarioCustom({ product, children }: RelicarioCustomProps) {

  //Variantes
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [imageUrls, setImageUrls] = useState({ gold: '', silver: '' });

  // texto / estilo
  const [fontFamily, setFontFamily] = useState("'Inter', sans-serif");
  const [petName, setPetName] = useState('');
  const [ownerInfo, setOwnerInfo] = useState('');
  const [variant, setVariant] = useState<'gold' | 'silver'>('gold');
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



  // cargar configuración guardada
  useEffect(() => {
    if (typeof window === "undefined") return;

    setFontFamily(localStorage.getItem('petTag_fontFamily') || "'Inter', sans-serif");
    setPetName(localStorage.getItem('petTag_petName') || '');
    setOwnerInfo(localStorage.getItem('petTag_ownerInfo') || '');
    setVariant((localStorage.getItem('petTag_variant') as 'gold' | 'silver') || 'gold');
  }, []);

  // imágenes base del relicario desde supabase
  useEffect(() => {
    const { data: goldData } = supabase.storage
        .from("relicarios-images")
        .getPublicUrl("relicario-gold.png");

    const { data: silverData } = supabase.storage
        .from("relicarios-images")
        .getPublicUrl("relicario-silver.png");

    setImageUrls({
      gold: goldData?.publicUrl ?? "",
      silver: silverData?.publicUrl ?? ""
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // elegir variante por defecto según el estado `variant` ('gold' | 'silver')
      const current = typed.find(v =>
          v.color?.toLowerCase() === variant ||
          v.name.toLowerCase().includes(variant)
      ) || typed[0] || null;

      setSelectedVariant(current);
    };

    loadVariants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);


  const handleRotate = () => {
    setIsRotating(true);
    setTimeout(() => {
      setCurrentFace((prev) => (prev === 1 ? 2 : 1));
      setIsRotating(false);
    }, 250);
  };

  const toggleVariant = () => {
    const next: 'gold' | 'silver' = variant === 'gold' ? 'silver' : 'gold';
    setVariant(next);

    if (typeof window !== "undefined") {
      localStorage.setItem('petTag_variant', next);
    }

    if (variants.length > 0) {
      const found = variants.find(v =>
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

    let splitIndex = normalized.lastIndexOf(' ', LIMIT);
    if (splitIndex <= 0) {
      const after = normalized.indexOf(' ', LIMIT);
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
              productVariantId: selectedVariant?.id ?? null,              quantity: 1,
              unitPrice: unitPrice,
              title: selectedVariant
                  ? `${product.title} - ${selectedVariant.name}`
                  : product.title,
              personalizationFront: petName || null,
              personalizationBack: ownerInfo || null,
              photos: photosForCheckout,
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

      if (!data.init_point) {
        console.error("Respuesta sin init_point (relicario):", data);
        alert("No se recibió la URL de pago.");
        return;
      }

      // opcional: console.log("Orden de relicario creada con id:", data.order_id);
      window.location.href = data.init_point;
    } catch (error) {
      console.error("Error en handlePay (relicario):", error);
      alert("Error al conectar con Mercado Pago.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>

        <DialogContent className="sm:max-w-3xl w-full max-h-[90vh] p-0 bg-transparent border-none">
          <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* botón cerrar */}
            <button
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 z-20 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>

            {/* HEADER */}
            <div className="bg-white border-b">
              <div className="px-6 py-4 flex items-center justify-between pr-16">
                <h1 className="text-lg md:text-xl font-bold text-zinc-900">
                  Personaliza tu relicario corazón
                </h1>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs md:text-sm text-zinc-600">Total</div>
                    <div className="text-lg md:text-2xl font-bold text-zinc-900">
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
                      disabled={(!selectedVariant && variants.length > 0) || (step === 2 && (!isCustomerFormValid || isPaying))}

                      className="bg-black text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-medium hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {step === 1
                        ? "Continuar"
                        : isPaying
                            ? "Redirigiendo..."
                            : "Confirmar y pagar"}
                  </button>
                </div>
              </div>
            </div>

            {/* CONTENIDO */}
            <div className="flex-1 overflow-y-auto p-8 pb-10 pt-6">
              {step === 1 && (
                  <>
                    {/* Preview del relicario */}
                    <div className="flex justify-center mb-8">
                      <div
                          className="relative w-[520px] h-[280px] perspective-1000"
                          style={{ transformStyle: 'preserve-3d' }}
                      >
                        {/* Frente */}
                        <div
                            className={`absolute inset-0 transition-transform duration-500 backface-hidden ${
                                currentFace === 1 ? 'rotate-y-0' : 'rotate-y-180'
                            }`}
                        >
                          <Image
                              src={variant === 'silver' ? imageUrls.silver : imageUrls.gold}
                              alt="Relicario (frente)"
                              fill
                              className="object-contain"
                          />
                          <div
                              className="absolute inset-0 flex items-center justify-center"
                              style={{
                                opacity: currentFace === 1 && !isRotating ? 1 : 0,
                                transition: 'opacity 0.2s ease-in-out'
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
                            }}
                        >
                          {formatTextWithBreak(petName)}
                        </span>
                          </div>
                        </div>

                        {/* Reverso */}
                        <div
                            className={`absolute inset-0 transition-transform duration-500 backface-hidden ${
                                currentFace === 2 ? 'rotate-y-0' : '-rotate-y-180'
                            }`}
                        >
                          <Image
                              src={variant === 'silver' ? imageUrls.silver : imageUrls.gold}
                              alt="Relicario (reverso)"
                              fill
                              className="object-contain"
                          />
                          <div
                              className="absolute inset-0 flex items-center justify-center"
                              style={{
                                opacity: currentFace === 2 && !isRotating ? 1 : 0,
                                transition: 'opacity 0.2s ease-in-out'
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
                            }}
                        >
                          {formatTextWithBreak(ownerInfo)}
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
                      {currentFace === 1 ? 'Ver reverso' : 'Ver anverso'}
                    </span>
                      </button>

                      <button
                          onClick={toggleVariant}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                      >
                        {variant === 'gold' ? 'Cambiar a Silver' : 'Cambiar a Gold'}
                      </button>
                    </div>

                    {/* Inputs de texto */}
                    <div className="space-y-4 mb-6">
                      <div>
                        <label htmlFor="tag-input" className="sr-only">
                          {currentFace === 1 ? 'Nombre de la mascota' : 'Información del dueño'}
                        </label>
                        <input
                            id="tag-input"
                            type="text"
                            value={currentFace === 1 ? petName : ownerInfo}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              if (newValue.length <= 15) {
                                if (currentFace === 1) {
                                  setPetName(newValue);
                                  if (typeof window !== "undefined") {
                                    localStorage.setItem('petTag_petName', newValue);
                                  }
                                } else {
                                  setOwnerInfo(newValue);
                                  if (typeof window !== "undefined") {
                                    localStorage.setItem('petTag_ownerInfo', newValue);
                                  }
                                }
                              }
                            }}
                            placeholder={currentFace === 1 ? "Nombre de la mascota" : "Info. de contacto del dueño"}
                            maxLength={15}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-sm font-semibold tracking-wide"
                        />
                        <p
                            className={`text-xs mt-1 text-center ${
                                (currentFace === 1 ? petName.length : ownerInfo.length) >= 15
                                    ? 'text-red-500'
                                    : 'text-gray-500'
                            }`}
                        >
                          {currentFace === 1
                              ? `${petName.length}/15 caracteres`
                              : `${ownerInfo.length}/15 caracteres`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Selector de fuente */}
                    <div className="mt-2 mb-6 flex justify-center">
                      <select
                          value={fontFamily}
                          onChange={(e) => {
                            const newFont = e.target.value;
                            setFontFamily(newFont);
                            if (typeof window !== "undefined") {
                              localStorage.setItem('petTag_fontFamily', newFont);
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

                    {/* Sección de upload de imagen */}
                    <div className="px-2 md:px-8 pb-6">
                      <div className="border-t border-gray-200 pt-4 mt-4">
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
                              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
file:rounded-full file:border-0 file:text-sm file:font-semibold
file:bg-green-50 file:text-green-700 hover:file:bg-green-100
disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        {uploadedImages.length > 0 && (
                            <div className="mt-4 flex gap-4">
                              {uploadedImages.map((img, index) => (
                                  <div
                                      key={index}
                                      className="relative w-32 h-32 rounded-lg overflow-hidden"
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
                                          setUploadedImages((prev) =>
                                              prev.filter((_, i) => i !== index)
                                          );
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
                  </>
              )}

              {step === 2 && (
                  <div className="max-w-md mx-auto">
                    <CustomerForm
                        data={customerData}
                        onChange={setCustomerData}
                    />
                  </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
  );
}
