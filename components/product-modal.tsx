'use client';

import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatCOP } from "@/lib/utils";
import { useState } from "react";

interface ProductModalProps {
  product: {
    id: string;
    title: string;
    price: number;
    img?: string;
    images?: string[]; // Array de imágenes adicionales
  };
  children: React.ReactNode;
}

function imgUrl(img?: string) {
  if (!img) return "/images/04.png";
  if (img.startsWith("http")) return img;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${img}`;
}

export function ProductModal({ product, children }: ProductModalProps) {
  // Crear array de imágenes: imagen principal + imágenes adicionales
  const allImages = [
    product.img,
    ...(product.images || [])
  ].filter(Boolean); // Filtrar valores undefined/null

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl p-0 bg-transparent border-none">
        <DialogTitle className="sr-only">
          {product.title} - {formatCOP(product.price)}
        </DialogTitle>
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="relative">
            <div className="absolute right-4 top-4 z-10">
              <DialogTrigger asChild>
                <button className="bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow">
                  <X className="h-5 w-5 text-amber-900" />
                </button>
              </DialogTrigger>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 p-6">
              {/* Carrusel de imágenes */}
              <div className="relative h-80 md:h-96 group">
                <Image
                  src={imgUrl(allImages[currentImageIndex])}
                  alt={product.title}
                  fill
                  className="object-cover rounded-lg"
                />
                
                {/* Controles del carrusel */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
                
                {/* Indicadores de imágenes */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                    {allImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Información del producto */}
              <div className="flex flex-col justify-center">
                <h2 className="text-2xl font-bold text-amber-900 mb-4">
                  {product.title}
                </h2>
                
                <p className="text-3xl font-bold text-orange-600 mb-6">
                  {formatCOP(product.price)}
                </p>
                
                <p className="text-amber-700 mb-6">
                  {/* Aquí puedes agregar más información del producto si la tienes */}
                  Producto exclusivo de Vibrancy. Calidad premium garantizada.
                </p>
                
                <div className="space-y-3">
                  <Link
                    href={`/producto/${product.id}`}
                    prefetch={true}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center block"
                  >
                    Ver detalles completos
                  </Link>
                  
                  <button className="w-full bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold py-3 px-6 rounded-lg transition-colors">
                    Agregar al carrito
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}