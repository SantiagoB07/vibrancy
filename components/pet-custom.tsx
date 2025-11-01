'use client';

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { X, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

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

  // Constraints
  const MAX_PER_LINE = 15; // 15 characters per line as requested
  const MAX_LINES = 2; // Assumption: up to two lines fits the tag best

  // Sanitize input to respect per-line and max-lines constraints
  function clampMultiline(value: string) {
    const lines = value.split(/\r?\n/).slice(0, MAX_LINES);
    const trimmed = lines.map((l) => l.slice(0, MAX_PER_LINE));
    return trimmed.join("\n");
  }

  const currentValue = currentFace === 1 ? petName : ownerInfo;
  const currentLines = useMemo(() => currentValue.split(/\r?\n/), [currentValue]);

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
                      className="absolute inset-0 flex items-center justify-center px-10 text-center"
                      style={{
                        opacity: isRotating ? 0 : 1,
                        transition: 'opacity 0.1s ease-in-out',
                        transform: currentFace === 2 ? 'scaleX(-1)' : 'scaleX(1)'
                      }}
                    >
                      <div
                        className="font-bold text-gray-900 tracking-wide"
                        style={{
                          WebkitFontSmoothing: 'antialiased',
                          MozOsxFontSmoothing: 'grayscale',
                          textRendering: 'optimizeLegibility',
                          letterSpacing: '0.2px',
                          // Slightly smaller when using two lines
                          fontSize: currentLines.length > 1 ? 'clamp(11px, 4.8vw, 18px)' : 'clamp(13px, 6vw, 22px)',
                          lineHeight: 1.1,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          maxWidth: '100%'
                        }}
                      >
                        {currentFace === 1 ? petName : ownerInfo}
                      </div>
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
                  <textarea
                    value={currentValue}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const lines = currentValue.split(/\r?\n/);
                        if (lines.length >= MAX_LINES) {
                          e.preventDefault();
                        }
                      }
                    }}
                    onChange={(e) => {
                      const clamped = clampMultiline(e.target.value);
                      if (currentFace === 1) {
                        setPetName(clamped);
                        localStorage.setItem('petTag_petName', clamped);
                      } else {
                        setOwnerInfo(clamped);
                        localStorage.setItem('petTag_ownerInfo', clamped);
                      }
                    }}
                    placeholder="Personaliza tu placa (Enter para nueva línea)"
                    rows={Math.min(MAX_LINES, Math.max(1, currentLines.length))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-sm font-semibold tracking-wide resize-none"
                  />
                  <div className="mt-1 text-center text-xs text-gray-500">
                    {currentLines.map((l, i) => (
                      <div key={i}>{`L${i + 1}: ${l.length}/${MAX_PER_LINE} caracteres`}</div>
                    ))}
                    {currentLines.length < MAX_LINES && (
                      <div>{`Puedes añadir otra línea (máx. ${MAX_LINES}).`}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
