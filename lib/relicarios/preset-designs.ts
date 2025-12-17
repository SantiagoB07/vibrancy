export type RelicarioTextPosition = "below" | "above" | "left" | "right" | "center";

export interface RelicarioPresetDesign {
  id: string;
  /** Path relativo a /public */
  path: string;
  label?: string;
  defaultText?: string;
  position?: RelicarioTextPosition;

  /** Tamaño del SVG (px) */
  width?: number;
  height?: number;

  /** Estilo del texto */
  fontFamily?: string;
  color?: string;
  fontSize?: number;
  maxChars?: number;

  /** Offset (px) SOLO del SVG relativo al centro del relicario */
  offsetX?: number;
  offsetY?: number;

  /**
   * Offset (px) SOLO del texto relativo a su posición por defecto.
   * Útil para ajustar finamente cada diseño sin mover el SVG.
   */
  textOffsetX?: number;
  textOffsetY?: number;
}

export const RELICARIO_PRESET_DESIGNS: RelicarioPresetDesign[] = [
  {
    id: "alas",
    path: "/images/eRelicarios/alas.svg",
    label: "Alas",
    position: "below",
    defaultText: "Texto",
    offsetX: 0,
    offsetY: 12,
    width: 105,
    height: 62,
    textOffsetX: 0,
    textOffsetY: -10,
  },
  {
    id: "anillos",
    path: "/images/eRelicarios/anillos.svg",
    label: "Anillos",
    position: "right",
    defaultText: "Texto",
    offsetX: 0,
    offsetY: -12,
    width: 72,
    height: 52,
    textOffsetX: -10,
    textOffsetY: 30,
  },
  {
    id: "corazon",
    path: "/images/eRelicarios/corazon.svg",
    label: "Corazón",
    position: "right",
    defaultText: "Texto",
    offsetX: -16,
    offsetY: 0,
    width: 59,
    height: 59,
    textOffsetX: 0,
    textOffsetY: 15,
  },
  {
    id: "corazon2",
    path: "/images/eRelicarios/corazon2.svg",
    label: "Corazón 2",
    position: "below",
    defaultText: "Texto",
    offsetX: 0,
    offsetY: 16,
    width: 105,
    height: 59,
  },
  {
    id: "corazon3",
    path: "/images/eRelicarios/corazon3.svg",
    label: "Corazón 3",
    position: "left",
    defaultText: "Texto",
    offsetX: 16,
    offsetY: 5,
    width: 59,
    height: 59,
    textOffsetX: -5,
    textOffsetY: -5,
  },
  {
    id: "corazon4",
    path: "/images/eRelicarios/corazon4.svg",
    label: "Corazón 4",
    position: "above",
    defaultText: "Texto",
    offsetX: 0,
    offsetY: 34,
    width: 120,
    height: 67,
    textOffsetX: 0,
    textOffsetY: -25,
  },
  {
    id: "estrellas",
    path: "/images/eRelicarios/estrellas.svg",
    label: "Estrellas",
    position: "right",
    defaultText: "Texto",
    offsetX: -4,
    offsetY: 14,
    width: 67,
    height: 120,
  },
  {
    id: "flores",
    path: "/images/eRelicarios/flores.svg",
    label: "Flores",
    position: "above",
    defaultText: "Texto",
    offsetX: -12,
    offsetY: 15,
    width: 84,
    height: 84,
    textOffsetY: -28,
    textOffsetX: 25,
  },
  {
    id: "flores2",
    path: "/images/eRelicarios/flores2.svg",
    label: "Flores 2",
    position: "right",
    defaultText: "Texto",
    offsetX: -8,
    offsetY: 10,
    width: 64,
    height: 90,
    textOffsetX: 10,
    textOffsetY: -5,
  },
  {
    id: "mariposas",
    path: "/images/eRelicarios/mariposas.svg",
    label: "Mariposas",
    position: "right",
    defaultText: "Texto",
    offsetX: -14,
    offsetY: 0,
    width: 64,
    height: 75,
    textOffsetX: 10,
    textOffsetY: 0,
  },
];
