'use client';

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { X, RotateCcw } from "lucide-react";
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
  const [petName, setPetName] = useState('');
  const [ownerInfo, setOwnerInfo] = useState('');
  const [currentFace, setCurrentFace] = useState(1);
  const [isRotating, setIsRotating] = useState(false);

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
                  <div 
                    className="relative w-56 h-28 transition-transform duration-500"
                    style={{ 
                      transform: currentFace === 2 ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    {/* Rectangle with metallic finish */}
                    <div className="absolute inset-0 rounded-lg shadow-lg" 
                         style={{
                           background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 25%, #f3f4f6 50%, #d1d5db 75%, #9ca3af 100%)',
                           boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.2)'
                         }}>
                      <div className="flex items-center justify-center h-full">
                        <div 
                          className="text-center"
                          style={{
                            opacity: isRotating ? 0 : 1,
                            transition: 'opacity 0.1s ease-in-out',
                            transform: currentFace === 2 ? 'scaleX(-1)' : 'scaleX(1)'
                          }}
                        >
                          <div className="text-base font-bold text-gray-900 max-w-28 truncate drop-shadow-sm">
                            {currentFace === 1 
                              ? (petName || 'YOUR PET NAME')
                              : (ownerInfo || 'YOUR PHONE')
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Blended circles for seamless bone shape */}
                    {/* Top-left circle */}
                    <div className="absolute -top-6 -left-6 w-16 h-16 rounded-full"
                         style={{
                           background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 25%, #f3f4f6 50%, #d1d5db 75%, #9ca3af 100%)',
                           boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.1)',
                           filter: 'blur(1px)'
                         }}>
                    </div>
                    
                    {/* Top-right circle */}
                    <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full"
                         style={{
                           background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 25%, #f3f4f6 50%, #d1d5db 75%, #9ca3af 100%)',
                           boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.1)',
                           filter: 'blur(1px)'
                         }}>
                    </div>
                    
                    {/* Bottom-left circle */}
                    <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full"
                         style={{
                           background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 25%, #f3f4f6 50%, #d1d5db 75%, #9ca3af 100%)',
                           boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.1)',
                           filter: 'blur(1px)'
                         }}>
                    </div>
                    
                    {/* Bottom-right circle */}
                    <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full"
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

              {/* Face Switch Button */}
              <div className="flex justify-center mb-6">
                <button
                  onClick={() => {
                    setIsRotating(true);
                    setCurrentFace(currentFace === 1 ? 2 : 1);
                    setTimeout(() => setIsRotating(false), 500);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {currentFace === 1 ? 'Ver cara 2' : 'Ver cara 1'}
                  </span>
                </button>
              </div>

              {/* Customization Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentFace === 1 ? 'Personaliza tu placa' : 'Información del dueño'}
                  </label>
                  <input
                    type="text"
                    value={currentFace === 1 ? petName : ownerInfo}
                    onChange={(e) => currentFace === 1 ? setPetName(e.target.value) : setOwnerInfo(e.target.value)}
                    placeholder={currentFace === 1 ? "YOUR PET NAME" : "YOUR PHONE NUMBER"}
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
