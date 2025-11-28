'use client';

import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { X, RotateCcw } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { Inter, Lobster, Coming_Soon, Pacifico, Tangerine } from 'next/font/google';

export const inter = Inter({ subsets: ['latin'], weight: ['400', '700'] });
export const lobster = Lobster({ subsets: ['latin'], weight: ['400'] });
export const robotoSlab = Coming_Soon({ subsets: ['latin'], weight: ['400'] });
export const pacifico = Pacifico({ subsets: ['latin'], weight: ['400'] });
export const tangerine = Tangerine({ subsets: ['latin'], weight: ['400', '700'] });

interface RelicarioCircCustomProps {
  product: {
    id: string;
    title: string;
    price: number;
    img?: string;
  };
  children: React.ReactNode;
}

// Rutas a tus imágenes locales
const REL_TAG_GOLD_IMG = '/images/relicario_2.png';
const REL_TAG_SILVER_IMG = '/images/relicario_2p.png';

export function RelicarioCircCustom({ product, children }: RelicarioCircCustomProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fontFamily, setFontFamily] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('petTag_fontFamily') || "'Inter', sans-serif";
    }
    return "'Inter', sans-serif";
  });
  const [petName, setPetName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('petTag_petName') || '';
    }
    return '';
  });
  const [ownerInfo, setOwnerInfo] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('petTag_ownerInfo') || '';
    }
    return '';
  });
  const [currentFace, setCurrentFace] = useState(1); // 1 frente, 2 reverso
  const [isRotating, setIsRotating] = useState(false);

  // Variant (gold / silver)
  const [variant, setVariant] = useState(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('petTag_variant') as 'gold' | 'silver') || 'gold';
    }
    return 'gold';
  });

  const toggleVariant = () => {
    const next = variant === 'gold' ? 'silver' : 'gold';
    setVariant(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('petTag_variant', next);
    }
  };

  // Texto con salto de línea
  const formatTextWithBreak = (text: string): React.ReactNode => {
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

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ===== HEADER: nf, total, handlePay =====
  const nf = new Intl.NumberFormat("es-CO");
  const total = product.price;

  const handlePay = () => {
    console.log("Pagar ahora (relicario circular)", {
      product,
      variant,
      petName,
      ownerInfo,
      uploadedImage,
    });
  };
  // ========================================

  // Giro
  const handleRotate = () => {
    setIsRotating(true);
    setTimeout(() => {
      setCurrentFace(currentFace === 1 ? 2 : 1);
      setIsRotating(false);
    }, 250);
  };

  return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>

        <DialogContent className="sm:max-w-3xl w-full max-h-[90vh] p-0 bg-transparent border-none">
          <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Botón cerrar */}
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
                  Personaliza tu relicario
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

            {/* CONTENIDO CON SCROLL */}
            <div className="flex-1 overflow-y-auto p-8 pb-10 pt-6">
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
                        src={variant === 'silver' ? REL_TAG_SILVER_IMG : REL_TAG_GOLD_IMG}
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
                        src={variant === 'silver' ? REL_TAG_SILVER_IMG : REL_TAG_GOLD_IMG}
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

              {/* Botones de cara y variante */}
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

              {/* Input de texto */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="tag-input" className="sr-only">
                    {currentFace === 1 ? 'Nombre / frase frente' : 'Texto reverso'}
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
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('petTag_petName', newValue);
                            }
                          } else {
                            setOwnerInfo(newValue);
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('petTag_ownerInfo', newValue);
                            }
                          }
                        }
                      }}
                      placeholder={currentFace === 1 ? "Nombre / frase frente" : "Frase reverso"}
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
                        : `${ownerInfo.length}/15 caracteres`}
                  </p>
                </div>
              </div>

              {/* Selector de fuente */}
              <div className="mt-4 flex justify-center">
                <select
                    value={fontFamily}
                    onChange={(e) => {
                      const newFont = e.target.value;
                      setFontFamily(newFont);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('petTag_fontFamily', newFont);
                      }
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="'Inter', sans-serif">Inter (moderno)</option>
                  <option value="'Lobster', cursive">Lobster (decorativo)</option>
                  <option value="'Pacifico', cursive">Pacifico (caligráfico)</option>
                  <option value="'Roboto Slab', serif">Roboto Slab (serif elegante)</option>
                  <option value="monospace">Monospace (teclado)</option>
                  <option value="tangerine">Tangerine (clásico)</option>
                </select>
              </div>

              {/* Sección subir imagen */}
              <div className="px-0 pb-0 mt-6">
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Sube tu imagen personalizada para añadir al relicario.
                  </h3>
                  <div className="flex items-center space-x-4">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0 file:text-sm file:font-semibold
                      file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                  </div>
                  {uploadedImage && (
                      <div className="mt-4">
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                          <Image
                              src={uploadedImage}
                              alt="Imagen cargada"
                              fill
                              className="object-cover"
                          />
                        </div>
                      </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  );
}
