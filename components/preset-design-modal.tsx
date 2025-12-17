'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';

import type { RelicarioPresetDesign as PresetDesign } from '@/lib/relicarios/preset-designs';

interface PresetDesignModalProps {
  designs: PresetDesign[];
  trigger?: React.ReactNode;
  onConfirm: (design: PresetDesign) => void;
}

export default function PresetDesignModal({ designs, trigger, onConfirm }: PresetDesignModalProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<PresetDesign | null>(null);
  const [customText, setCustomText] = useState('');
  const [fontFamily, setFontFamily] = useState<string>("'Inter', sans-serif");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button className="px-3 py-2 bg-gray-100 rounded-md">Editar diseño</button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl p-4">
        <DialogTitle className="text-lg font-semibold mb-2">Seleccionar diseño</DialogTitle>

        <div className="grid grid-cols-3 gap-3">
          {designs.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setPreview(d);
                setCustomText(d.defaultText || 'Nombre');
              }}
              className="p-2 border rounded hover:shadow"
            >
                <div className="relative" style={{ width: d.width ?? 150, height: d.height ?? 84, overflow: 'hidden' }}>
                  <Image src={d.path as string} alt={d.label || d.id} width={d.width ?? 150} height={d.height ?? 84} style={{ width: d.width ?? 150, height: d.height ?? 84 }} className="object-contain" />
                </div>
              <div className="text-xs text-center mt-1">{d.label || d.id}</div>
            </button>
          ))}
        </div>

        {preview && (
          <div className="mt-4">
          <div className="flex items-start gap-4">
            <div className="relative w-[180px] h-[120px] border rounded bg-white flex items-center justify-center">
              <div
                style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
              >
                <div
                  className="relative"
                  style={{
                    width: preview.width ?? 150,
                    height: preview.height ?? 84,
                    overflow: 'hidden',
                    transform: `translate(${preview.offsetX ?? 0}px, ${preview.offsetY ?? 0}px)`,
                  }}
                >
                  <Image src={preview.path as string} alt={preview.label || ''} width={preview.width ?? 150} height={preview.height ?? 84} style={{ width: preview.width ?? 150, height: preview.height ?? 84 }} className="object-contain" />
                </div>
              </div>
            {/* preview text positioned according to preview.position */}
            {preview.position === 'below' && (
              <div style={{ fontFamily }} className="absolute left-1/2"
                role="presentation"
                >
                <div
                  style={{
                    transform: `translateX(calc(-50% + ${preview.textOffsetX ?? 0}px)) translateY(${preview.textOffsetY ?? 0}px)`,
                    fontSize: preview.fontSize ? `${preview.fontSize}px` : undefined,
                    color: preview.color,
                    lineHeight: '1.05',
                  }}
                  className="bottom-2 font-semibold text-center"
                >
                  {customText}
                </div>
              </div>
            )}
            {preview.position === 'above' && (
              <div style={{ fontFamily }} className="absolute left-1/2" role="presentation">
                <div
                  style={{
                    transform: `translateX(calc(-50% + ${preview.textOffsetX ?? 0}px)) translateY(${preview.textOffsetY ?? 0}px)`,
                    fontSize: preview.fontSize ? `${preview.fontSize}px` : undefined,
                    color: preview.color,
                    lineHeight: '1.05',
                  }}
                  className="top-2 font-semibold text-center"
                >
                  {customText}
                </div>
              </div>
            )}
            {preview.position === 'left' && (
              <div style={{ fontFamily }} className="absolute top-1/2" role="presentation">
                <div
                  style={{
                    transform: `translateY(calc(-50% + ${preview.textOffsetY ?? 0}px)) translateX(${preview.textOffsetX ?? 0}px)`,
                    fontSize: preview.fontSize ? `${preview.fontSize}px` : undefined,
                    color: preview.color,
                    lineHeight: '1.05',
                  }}
                  className="font-semibold text-center"
                >
                  {customText}
                </div>
              </div>
            )}
            {preview.position === 'right' && (
              <div style={{ fontFamily }} className="absolute top-1/2" role="presentation">
                <div
                  style={{
                    transform: `translateY(calc(-50% + ${preview.textOffsetY ?? 0}px)) translateX(${preview.textOffsetX ?? 0}px)`,
                    fontSize: preview.fontSize ? `${preview.fontSize}px` : undefined,
                    color: preview.color,
                    lineHeight: '1.05',
                  }}
                  className="font-semibold text-center"
                >
                  {customText}
                </div>
              </div>
            )}
            {preview.position === 'center' && (
              <div style={{ fontFamily }} className="absolute left-1/2 top-1/2" role="presentation">
                <div
                  style={{
                    transform: `translate(calc(-50% + ${preview.textOffsetX ?? 0}px), calc(-50% + ${preview.textOffsetY ?? 0}px))`,
                    fontSize: preview.fontSize ? `${preview.fontSize}px` : undefined,
                    color: preview.color,
                    lineHeight: '1.05',
                  }}
                  className="font-semibold text-center"
                >
                  {customText}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="mb-2">Posición: <strong>{preview.position}</strong></div>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              maxLength={preview.maxChars ?? 15}
            />

            <div className="mt-3">
              <label className="text-xs">Fuente
                <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="w-full mt-1 px-2 py-1 border rounded">
                  <option value="'Inter', sans-serif">Inter</option>
                  <option value="'Lobster', cursive">Lobster</option>
                  <option value="'Pacifico', cursive">Pacifico</option>
                  <option value="'Roboto Slab', serif">Roboto Slab</option>
                  <option value="monospace">Monospace</option>
                  <option value="'Tangerine', cursive">Tangerine</option>
                </select>
              </label>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  // confirm selection with the text set as defaultText and selected fontFamily
                  onConfirm({ ...preview, defaultText: customText, fontFamily });
                  setOpen(false);
                }}
                className="px-3 py-2 bg-green-500 text-white rounded"
              >
                Confirmar diseño
              </button>
              <button
                onClick={() => {
                  setPreview(null);
                }}
                className="px-3 py-2 bg-gray-100 rounded"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
