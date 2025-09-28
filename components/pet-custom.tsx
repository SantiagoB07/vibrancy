'use client';

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useState } from "react";

interface PetCustomProps {
  product: {
    id: string;
    title: string;
    price: number;
    img?: string;
  };
  children: React.ReactNode;
}

export function PetCustom({ product, children }: PetCustomProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [engravingText, setEngravingText] = useState('');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none">
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          <div className="relative">
            <div className="absolute right-4 top-4 z-10">
              <button 
                onClick={() => setIsOpen(false)}
                className="bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            
            <div className="p-8">
              {/* Pet Tag Preview */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  {/* Bone-shaped Pet Tag */}
                  <div className="relative w-40 h-20">
                    {/* Rectangle with metallic finish */}
                    <div className="absolute inset-0 rounded-lg shadow-lg" 
                         style={{
                           background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 25%, #f3f4f6 50%, #d1d5db 75%, #9ca3af 100%)',
                           boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.2)'
                         }}>
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="text-xs font-semibold text-gray-700 mb-1 drop-shadow-sm">PET TAG</div>
                          <div className="text-sm font-bold text-gray-900 max-w-20 truncate drop-shadow-sm">
                            {engravingText || 'YOUR PET NAME'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Blended circles for seamless bone shape */}
                    {/* Top-left circle */}
                    <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full"
                         style={{
                           background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 25%, #f3f4f6 50%, #d1d5db 75%, #9ca3af 100%)',
                           boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.1)',
                           filter: 'blur(1px)'
                         }}>
                    </div>
                    
                    {/* Top-right circle */}
                    <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full"
                         style={{
                           background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 25%, #f3f4f6 50%, #d1d5db 75%, #9ca3af 100%)',
                           boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.1)',
                           filter: 'blur(1px)'
                         }}>
                    </div>
                    
                    {/* Bottom-left circle */}
                    <div className="absolute -bottom-4 -left-4 w-12 h-12 rounded-full"
                         style={{
                           background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 25%, #f3f4f6 50%, #d1d5db 75%, #9ca3af 100%)',
                           boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.1)',
                           filter: 'blur(1px)'
                         }}>
                    </div>
                    
                    {/* Bottom-right circle */}
                    <div className="absolute -bottom-4 -right-4 w-12 h-12 rounded-full"
                         style={{
                           background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 25%, #f3f4f6 50%, #d1d5db 75%, #9ca3af 100%)',
                           boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.1)',
                           filter: 'blur(1px)'
                         }}>
                    </div>
                    
                    {/* Small hole at top */}
                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-600 rounded-full shadow-inner"></div>
                  </div>
                </div>
              </div>

              {/* Customization Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personaliza tu placa
                  </label>
                  <input
                    type="text"
                    value={engravingText}
                    onChange={(e) => setEngravingText(e.target.value)}
                    placeholder="YOUR PET NAME"
                    maxLength={15}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-sm font-semibold uppercase tracking-wide"
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Máximo 15 caracteres
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
