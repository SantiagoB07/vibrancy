'use client';

import { formatCOP } from "@/lib/utils";

interface Product {
  id: string;
  title: string;
  price: number;
  img?: string;
  category?: string;
}

interface ProductCardProps {
  product: Product;
  children: React.ReactNode; // El modal de personalización
}

function imgUrl(img?: string) {
  if (!img) return "/images/04.png";
  if (img.startsWith("http")) return img;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${img}`;
}

export function ProductCard({ product, children }: ProductCardProps) {
  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={imgUrl(product.img)}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Personalizable
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
          {product.title}
        </h3>
        
        <p className="text-2xl font-bold text-orange-500 mb-4">
          {formatCOP(product.price ?? 0)}
        </p>

        {/* El children es el modal wrapper (GirasolCustom, PetCustom, etc.) */}
        {children}
      </div>
    </div>
  );
}
