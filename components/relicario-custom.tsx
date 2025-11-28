'use client';

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { X, RotateCcw } from "lucide-react";
import { useState } from "react";
import Image from "next/image"; // Importar el componente Image de Next.js
import { Geist, Inter, Lobster,  Coming_Soon , Pacifico, Tangerine } from 'next/font/google';
import PresetDesignModal, { PresetDesign } from './preset-design-modal';

export const inter = Inter({ subsets: ['latin'], weight: ['400', '700'] });
export const lobster = Lobster({ subsets: ['latin'], weight: ['400'] });
export const robotoSlab = Coming_Soon({ subsets: ['latin'], weight: ['400'] });
export const pacifico = Pacifico({ subsets: ['latin'], weight: ['400'] });
export const tangerine = Tangerine({ subsets: ['latin'], weight: ['400', '700'] });

interface RelicarioCustomProps {
  product: {
    id: string;
    title: string;
    price: number;
    img?: string; // Mantener por si acaso, aunque no lo usaremos para la imagen base
  };
  children: React.ReactNode;
}

// Rutas a tus imágenes locales de la placa
const REL_TAG_GOLD_IMG = '/images/relicario_1.png'; // Asegúrate de tener esta imagen en public/images
const REL_TAG_SILVER_IMG = '/images/relicario_1p.png';   // Asegúrate de tener esta imagen en public/images

export function RelicarioCustom({ product, children }: RelicarioCustomProps) {
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
  const [currentFace, setCurrentFace] = useState(1); // 1 para el frente, 2 para la parte trasera
  const [isRotating, setIsRotating] = useState(false); // Para la transición de opacidad del texto
  const [textColor, setTextColor] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('petTag_textColor') || '#3b3b3b';
    return '#3b3b3b';
  });
  const [designFontSize, setDesignFontSize] = useState(() => {
    if (typeof window !== 'undefined') return Number(localStorage.getItem('petTag_fontSize')) || 20;
    return 20;
  });

  // Diseños predeterminados con configuración de posición de texto
  const PRESET_DESIGNS: PresetDesign[] = [
    // Alas: subir un poco y texto abajo
    { id: 'alas', path: '/images/eRelicarios/alas.svg', label: 'Alas', position: 'below', defaultText: 'Te amo', offsetX: 0, offsetY: -8, width: 120, height: 67 },
    // Anillos: subir un poco y texto abajo
    { id: 'anillos', path: '/images/eRelicarios/anillos.svg', label: 'Anillos', position: 'below', defaultText: 'Nombre', offsetX: 0, offsetY: -2, width: 105, height: 59 },
    // Corazón: mover a la izquierda y texto a la derecha
    { id: 'corazon', path: '/images/eRelicarios/corazon.svg', label: 'Corazón', position: 'right', defaultText: 'Perdóname', offsetX: -6, offsetY: 0, width: 105, height: 59 },
    // Corazón 2: subir un poco y texto abajo
    { id: 'corazon2', path: '/images/eRelicarios/corazon2.svg', label: 'Corazón 2', position: 'below', defaultText: 'Vuelve', offsetX: 0, offsetY: -6, width: 105, height: 59 },
    // Corazón 3: subir un poco y texto abajo
    { id: 'corazon3', path: '/images/eRelicarios/corazon3.svg', label: 'Corazón 3', position: 'below', defaultText: 'Te amo', offsetX: 0, offsetY: -6, width: 105, height: 59 },
    // Corazón 4: subir un poco y texto abajo
    { id: 'corazon4', path: '/images/eRelicarios/corazon4.svg', label: 'Corazón 4', position: 'below', defaultText: 'Te amo', offsetX: 0, offsetY: -4, width: 120, height: 67 },
    // Estrellas: mover a la izquierda y texto a la derecha
    { id: 'estrellas', path: '/images/eRelicarios/estrellas.svg', label: 'Estrellas', position: 'right', defaultText: 'Siempre juntos', offsetX: -14, offsetY: 0, width: 120, height: 67 },
    // Flores: subir un poco y texto abajo
    { id: 'flores', path: '/images/eRelicarios/flores.svg', label: 'Flores', position: 'below', defaultText: 'Nose', offsetX: 0, offsetY: -6, width: 120, height: 67 },
    // Flores 2: mover a la izquierda y texto a la derecha
    { id: 'flores2', path: '/images/eRelicarios/flores2.svg', label: 'Flores 2', position: 'right', defaultText: 'tampoco', offsetX: -8, offsetY: 0, width: 150, height: 84 },
    // Mariposas: mover a la izquierda y texto a la derecha
    { id: 'mariposas', path: '/images/eRelicarios/mariposas.svg', label: 'Mariposas', position: 'right', defaultText: 'algo', offsetX: -14, offsetY: 0, width: 105, height: 59 },
  ];

  // Diseño seleccionado (ruta relativa desde public/) y su configuración
  const [selectedDesign, setSelectedDesign] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('petTag_design') || null;
    }
    return null;
  });

  const [selectedDesignConfig, setSelectedDesignConfig] = useState<PresetDesign | null>(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('petTag_design_config');
      if (raw) try { return JSON.parse(raw) as PresetDesign; } catch { return null; }
    }
    return null;
  });

  // Use the latest preset definition if available (so changing PRESET_DESIGNS updates overlay sizes)
  const effectiveDesign = PRESET_DESIGNS.find(d => d.path === (selectedDesign || selectedDesignConfig?.path)) || selectedDesignConfig;

  const chooseDesign = (design: PresetDesign | null) => {
    setSelectedDesign(design ? design.path : null);
    setSelectedDesignConfig(design || null);
    if (design) {
      localStorage.setItem('petTag_design', design.path);
      localStorage.setItem('petTag_design_config', JSON.stringify(design));
      // apply design styling if present
      if (design.fontFamily) {
        setFontFamily(design.fontFamily);
        localStorage.setItem('petTag_fontFamily', design.fontFamily);
      }
      if (design.color) {
        setTextColor(design.color);
        localStorage.setItem('petTag_textColor', design.color);
      }
      if (design.fontSize) {
        setDesignFontSize(design.fontSize);
        localStorage.setItem('petTag_fontSize', String(design.fontSize));
      }
    } else {
      localStorage.removeItem('petTag_design');
      localStorage.removeItem('petTag_design_config');
    }
  };
  // Función para manejar el giro de la placa
  const handleRotate = () => {
    setIsRotating(true);
    // Cambiamos la cara después de un pequeño retraso para permitir la transición de opacidad
    setTimeout(() => {
      setCurrentFace(currentFace === 1 ? 2 : 1);
      setIsRotating(false); // Desactivar la rotación una vez que la nueva cara está visible
    }, 250); // La mitad de la duración de la animación de giro (500ms)
  };

    // Variant (gold / silver) y persistencia
  const [variant, setVariant] = useState(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('petTag_variant') as 'gold' | 'silver') || 'gold';
    }
    return 'gold';
  });

  const toggleVariant = () => {
    const next = variant === 'gold' ? 'silver' : 'gold';
    setVariant(next);
    localStorage.setItem('petTag_variant', next);
  };

 // Formatea el texto: si tiene más de 8 caracteres, inserta un salto de línea
  const formatTextWithBreak = (text: string): React.ReactNode => {
    if (!text) return text;
    const normalized = text.trim();
    const LIMIT = 8;
    if (normalized.length <= LIMIT) return normalized;

    // Buscar el último espacio antes (o en) el límite
    let splitIndex = normalized.lastIndexOf(' ', LIMIT);
    if (splitIndex <= 0) {
      // Si no hay, buscar el primer espacio después del límite
      const after = normalized.indexOf(' ', LIMIT);
      if (after > -1) splitIndex = after;
      else splitIndex = LIMIT; // fallback: cortar en el límite
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

  // Añadir esta función después de las otras funciones
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl sm:max-h-[90vh] p-0 bg-transparent border-none overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl min-h-[80vh] flex flex-col justify-between">
          {/* contenido */}
          <div className="relative">
            <div className="absolute right-4 top-10 z-20"> {/* Aumentado z-index */}
              <button 
                onClick={() => setIsOpen(false)}
                className="bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            
            <div className="p-8 pb-12">
              {/* Pet Tag Preview con imagen y texto superpuesto */}
              <div className="flex justify-center mb-8">
                <div className="relative w-[520px] h-[280px] perspective-1000" // Añadido perspective para el 3D
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Contenedor para el frente de la placa */}
                  <div 
                    className={`absolute inset-0 transition-transform duration-500 backface-hidden ${
                      currentFace === 1 ? 'rotate-y-0' : 'rotate-y-180'
                    }`}
                  >
                    <Image
                      src={variant === 'silver' ? REL_TAG_SILVER_IMG : REL_TAG_GOLD_IMG}
                       alt="Placa de mascota (frente)"
                       fill
                       className="object-contain" // Cambiado a object-contain para que la imagen se adapte sin recortar
                     />
                      {/* preset design overlay (frente) */}
                      {effectiveDesign && (
                        <div className="absolute inset-0 pointer-events-none z-10">
                          {/* Center the SVG and apply per-design offsets; render text relative to the SVG */}
                          <div
                            style={{
                              position: 'absolute',
                              left: '50%',
                              top: '50%',
                              transform: `translate(calc(-50% + ${effectiveDesign.offsetX ?? 0}px), calc(-50% + ${effectiveDesign.offsetY ?? 0}px))`
                            }}
                          >
                            {/* Wrapper that contains image + text so text stays positioned relative to the SVG */}
                            {(() => {
                              const txt = formatTextWithBreak(petName || effectiveDesign.defaultText || '');
                              // Compute font size; make it slightly smaller when text is on the right
                              const rawFontSize = effectiveDesign.fontSize ?? designFontSize;
                              const computedFontSize = effectiveDesign.position === 'right' ? Math.round(rawFontSize * 0.85) : rawFontSize;
                              const baseStyle = {
                                fontFamily: effectiveDesign.fontFamily || fontFamily,
                                color: effectiveDesign.color || textColor,
                                fontSize: `${computedFontSize}px`,
                                // remove horizontal padding when text is left/right to keep it tight to the SVG
                                padding: effectiveDesign.position === 'left' || effectiveDesign.position === 'right' ? '0' : '0 8px'
                              } as any;
                              const ox = effectiveDesign.offsetX ?? 0;
                              const oy = effectiveDesign.offsetY ?? 0;
                              // Restore negative gap so text sits tight against the SVG (matches previous appearance)
                              const horizGap = -20;

                              // Render different layouts depending on position
                              switch (effectiveDesign.position) {
                                case 'below':
                                  return (
                                    <div className="flex flex-col items-center">
                                                <div className="relative" style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84, overflow: 'hidden' }}>
                                                  <Image src={effectiveDesign.path} alt={effectiveDesign.label || ''} width={effectiveDesign.width ?? 150} height={effectiveDesign.height ?? 84} style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84 }} className="object-contain" />
                                                </div>
                                      <div style={{ ...baseStyle, marginTop: oy }}>{txt}</div>
                                    </div>
                                  );
                                case 'above':
                                  return (
                                    <div className="flex flex-col items-center">
                                      <div style={{ ...baseStyle, marginBottom: oy }}>{txt}</div>
                                      <div className="relative" style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84, overflow: 'hidden' }}>
                                        <Image src={effectiveDesign.path} alt={effectiveDesign.label || ''} width={effectiveDesign.width ?? 150} height={effectiveDesign.height ?? 84} style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84 }} className="object-contain" />
                                      </div>
                                    </div>
                                  );
                                case 'left':
                                  return (
                                    <div className="flex items-center">
                                      <div style={{ ...baseStyle, marginRight: horizGap }}>{txt}</div>
                                      <div className="relative" style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84, overflow: 'hidden' }}>
                                        <Image src={effectiveDesign.path} alt={effectiveDesign.label || ''} width={effectiveDesign.width ?? 150} height={effectiveDesign.height ?? 84} style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84 }} className="object-contain" />
                                      </div>
                                    </div>
                                  );
                                case 'right':
                                  return (
                                    <div className="flex items-center">
                                      <div className="relative" style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84, overflow: 'hidden' }}>
                                        <Image src={effectiveDesign.path} alt={effectiveDesign.label || ''} width={effectiveDesign.width ?? 150} height={effectiveDesign.height ?? 84} style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84 }} className="object-contain" />
                                      </div>
                                      <div style={{ ...baseStyle, marginLeft: horizGap }}>{txt}</div>
                                    </div>
                                  );
                                case 'center':
                                default:
                                  return (
                                    <div className="relative" style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84, overflow: 'visible' }}>
                                      <div className="relative" style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84, overflow: 'hidden' }}>
                                        <Image src={effectiveDesign.path} alt={effectiveDesign.label || ''} width={effectiveDesign.width ?? 150} height={effectiveDesign.height ?? 84} style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84 }} className="object-contain" />
                                      </div>
                                      <div style={{ ...baseStyle, position: 'absolute', left: '50%', top: '50%', transform: `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px))` }}>{txt}</div>
                                    </div>
                                  );
                              }
                            })()}
                          </div>
                        </div>
                      )}
                    <div 
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ zIndex: 20, 
                        opacity: currentFace === 1 && !isRotating ? 1 : 0, 
                        transition: 'opacity 0.2s ease-in-out' 
                      }}
                    >
                      {!effectiveDesign && (
                        <span
                          className="text-xl font-extrabold text-[#3b3b3b] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] tracking-wide text-center inline-block max-w-[90%]"
                          style={{
                              fontFamily,
                              textShadow: `
                                0 1px 1px rgba(255,255,255,0.8),
                                0 2px 2px rgba(0,0,0,0.2)
                              `,
                              color: textColor,
                              fontSize: `${designFontSize}px`
                            }}
                        >
                          {formatTextWithBreak(petName)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contenedor para la parte trasera de la placa */}
                  <div 
                    className={`absolute inset-0 transition-transform duration-500 backface-hidden ${
                      currentFace === 2 ? 'rotate-y-0' : '-rotate-y-180' // Rota en sentido contrario para mostrar el reverso
                    }`}
                  >
                    <Image
                      src={variant === 'silver' ? REL_TAG_SILVER_IMG : REL_TAG_GOLD_IMG}
                       alt="Placa de mascota (reverso)"
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
                                        {/* preset design overlay (reverso) */}
                                        {effectiveDesign && (
                                          <div className="absolute inset-0 pointer-events-none z-10">
                                            {/* Center the SVG and apply per-design offsets; render back text relative to the SVG */}
                                            <div
                                                style={{
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transform: `translate(calc(-50% + ${effectiveDesign.offsetX ?? 0}px), calc(-50% + ${effectiveDesign.offsetY ?? 0}px))`
                                              }}
                                            >
                                              {(() => {
                                                const txt = formatTextWithBreak(ownerInfo || effectiveDesign.defaultText || '');
                                                // Compute font size; make it slightly smaller when text is on the right
                                                const rawFontSize = effectiveDesign.fontSize ?? designFontSize;
                                                const computedFontSize = effectiveDesign.position === 'right' ? Math.round(rawFontSize * 0.7) : rawFontSize;
                                                const baseStyle = {
                                                  fontFamily: effectiveDesign.fontFamily || fontFamily,
                                                  color: effectiveDesign.color || textColor,
                                                  fontSize: `${computedFontSize}px`,
                                                  // remove horizontal padding when text is left/right to keep it tight to the SVG
                                                  padding: effectiveDesign.position === 'left' || effectiveDesign.position === 'right' ? '0' : '0 8px'
                                                } as any;
                                                const ox = effectiveDesign.offsetX ?? 0;
                                                const oy = effectiveDesign.offsetY ?? 0;
                                                // Restore negative gap so text sits tight against the SVG (matches previous appearance)
                                                const horizGap = -30;
                                                switch (effectiveDesign.position) {
                                                  case 'below':
                                                    return (
                                                      <div className="flex flex-col items-center">
                                                        <div className="relative" style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84, overflow: 'hidden' }}>
                                                          <Image src={effectiveDesign.path} alt={effectiveDesign.label || ''} width={effectiveDesign.width ?? 150} height={effectiveDesign.height ?? 84} style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84 }} className="object-contain" />
                                                        </div>
                                                        <div style={{ ...baseStyle, marginTop: oy }}>{txt}</div>
                                                      </div>
                                                    );
                                                  case 'above':
                                                    return (
                                                      <div className="flex flex-col items-center">
                                                        <div style={{ ...baseStyle, marginBottom: oy }}>{txt}</div>
                                                        <div className="relative" style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84, overflow: 'hidden' }}>
                                                          <Image src={effectiveDesign.path} alt={effectiveDesign.label || ''} width={effectiveDesign.width ?? 150} height={effectiveDesign.height ?? 84} style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84 }} className="object-contain" />
                                                        </div>
                                                      </div>
                                                    );
                                                  case 'left':
                                                    return (
                                                      <div className="flex items-center">
                                                        <div style={{ ...baseStyle, marginRight: horizGap }}>{txt}</div>
                                                        <div className="relative" style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84, overflow: 'hidden' }}>
                                                          <Image src={effectiveDesign.path} alt={effectiveDesign.label || ''} width={effectiveDesign.width ?? 150} height={effectiveDesign.height ?? 84} style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84 }} className="object-contain" />
                                                        </div>
                                                      </div>
                                                    );
                                                  case 'right':
                                                    return (
                                                      <div className="flex items-center">
                                                        <div className="relative" style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84, overflow: 'hidden' }}>
                                                          <Image src={effectiveDesign.path} alt={effectiveDesign.label || ''} width={effectiveDesign.width ?? 150} height={effectiveDesign.height ?? 84} style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84 }} className="object-contain" />
                                                        </div>
                                                        <div style={{ ...baseStyle, marginLeft: horizGap }}>{txt}</div>
                                                      </div>
                                                    );
                                                  case 'center':
                                                  default:
                                                    return (
                                                      <div className="relative" style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84, overflow: 'visible' }}>
                                                        <div className="relative" style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84, overflow: 'hidden' }}>
                                                          <Image src={effectiveDesign.path} alt={effectiveDesign.label || ''} width={effectiveDesign.width ?? 150} height={effectiveDesign.height ?? 84} style={{ width: effectiveDesign.width ?? 150, height: effectiveDesign.height ?? 84 }} className="object-contain" />
                                                        </div>
                                                        <div style={{ ...baseStyle, position: 'absolute', left: '50%', top: '50%', transform: `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px))` }}>{txt}</div>
                                                      </div>
                                                    );
                                                }
                                              })()}
                                            </div>
                                          </div>
                                          )}
                                        {!effectiveDesign && (
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
                                        )}
                                      </div>
                  </div>
                </div>
              </div>

              {/* Face Switch Button */}
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

              {/* Selector de diseños predeterminados (ahora con modal) */}
              <div className="px-8 mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Diseños predeterminados</h4>
                  <PresetDesignModal
                    designs={PRESET_DESIGNS}
                    trigger={<button className="px-3 py-2 bg-gray-100 rounded-md text-sm">Editar diseños</button>}
                    onConfirm={(d) => chooseDesign(d)}
                  />
                </div>

                <div className="grid grid-cols-4 gap-3 mt-2">
                  {PRESET_DESIGNS.map((d) => {
                    const active = selectedDesign === d.path;
                    return (
                      <button
                        key={d.id}
                        onClick={() => chooseDesign(d)}
                        className={`p-1 border rounded-md overflow-hidden ${active ? 'ring-2 ring-green-500' : 'border-gray-200'}`}
                        aria-pressed={active}
                        title={d.label || d.id}
                      >
                              <div className="relative" style={{ width: d.width ?? 150, height: d.height ?? 84 }}>
                                <Image src={d.path} alt={d.label || d.id} width={d.width ?? 150} height={d.height ?? 84} style={{ width: d.width ?? 150, height: d.height ?? 84 }} className="object-contain" />
                              </div>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => chooseDesign(null)}
                    className="col-span-4 mt-1 px-3 py-2 bg-gray-100 rounded-md text-sm"
                  >
                    Quitar diseño
                  </button>
                </div>
              </div>

              {/* Customization Input */}
              <div className="space-y-4">
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
                      const limit = selectedDesignConfig?.maxChars ?? 15;
                      if (newValue.length <= limit) {
                        if (currentFace === 1) {
                          setPetName(newValue);
                          localStorage.setItem('petTag_petName', newValue);
                        } else {
                          setOwnerInfo(newValue);
                          localStorage.setItem('petTag_ownerInfo', newValue);
                        }
                      }
                    }}
                    placeholder={currentFace === 1 ? "Nombre de la mascota" : "Info. de contacto del dueño"}
                    maxLength={selectedDesignConfig?.maxChars ?? 15}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-sm font-semibold tracking-wide"
                  />
                  <p className={`text-xs mt-1 text-center ${
                    (currentFace === 1 ? petName.length : ownerInfo.length) >= (selectedDesignConfig?.maxChars ?? 15)
                      ? 'text-red-500'
                      : 'text-gray-500'
                  }`}>
                    {currentFace === 1 
                      ? `${petName.length}/${selectedDesignConfig?.maxChars ?? 15} caracteres`
                      : `${ownerInfo.length}/${selectedDesignConfig?.maxChars ?? 15} caracteres`
                    }
                  </p>
                </div>
              </div>
              
              
            </div>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between">
          {/* Añadir esta sección después del div de customización */}
          <div className="px-8 pb-6">
            <div className="border-t border-gray-200 pt-4 mt-4">
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