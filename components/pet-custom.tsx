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
            
            <div className="p-8 pb-12">
              {/* Pet Tag Preview */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  {/* Bone-shaped Pet Tag IMAGE */}
                  <div
                    className="relative w-72 transition-transform duration-500"
                    style={{
                      transform: currentFace === 2 ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    <img
                      src="/images/pet-tag-removebg-preview.png"
                      alt="Placa para mascota en forma de hueso"
                      className="block w-72 h-auto select-none pointer-events-none drop-shadow"
                    />

                    {/* Text overlay */}
                    <div
                      className="absolute inset-0 flex items-center justify-center px-10"
                      style={{
                        opacity: isRotating ? 0 : 1,
                        transition: 'opacity 0.1s ease-in-out',
                        transform: currentFace === 2 ? 'scaleX(-1)' : 'scaleX(1)'
                      }}
                    >
                      <span
                        className="text-center font-bold text-gray-900 tracking-wide"
                        style={{
                          textShadow: '0 1px 0 rgba(255,255,255,0.7), 0 -1px 0 rgba(0,0,0,0.4)',
                          // Clamp font-size to fit inside the tag horizontally
                          fontSize: 'clamp(12px, 6vw, 22px)',
                          lineHeight: 1.1,
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          maxWidth: '100%'
                        }}
                      >
                        {currentFace === 1 ? petName : ownerInfo}
                      </span>
                    </div>
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
                  <input
                    type="text"
                    value={currentFace === 1 ? petName : ownerInfo}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      if (newValue.length <= 15) {
                        if (currentFace === 1) {
                          setPetName(newValue);
                          localStorage.setItem('petTag_petName', newValue);
                        } else {
                          setOwnerInfo(newValue);
                          localStorage.setItem('petTag_ownerInfo', newValue);
                        }
                      }
                    }}
                    placeholder="Personaliza tu placa"
                    maxLength={15}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-sm font-semibold tracking-wide"
                  />
                  <p className={`text-xs mt-1 text-center ${
                    (currentFace === 1 ? petName.length : ownerInfo.length) >= 15
                      ? 'text-red-500'
                      : 'text-gray-500'
                  }`}>
                    {currentFace === 1 
                      ? `${petName.length}/15 caracteres`
                      : `${ownerInfo.length}/15 caracteres`
                    }
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
