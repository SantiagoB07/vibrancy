import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

//Función para formatear COP
export function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
}


// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

// ================================
// Logger Condicional
// ================================

const isDev = process.env.NODE_ENV === "development";

/**
 * Logger condicional que solo muestra logs en desarrollo.
 * En producción, los logs no se muestran.
 */
export const logger = {
    log: (...args: unknown[]) => {
        if (isDev) console.log(...args);
    },
    warn: (...args: unknown[]) => {
        if (isDev) console.warn(...args);
    },
    error: (...args: unknown[]) => {
        // Los errores siempre se muestran (útil para debugging en producción)
        console.error(...args);
    },
    info: (...args: unknown[]) => {
        if (isDev) console.info(...args);
    },
    debug: (...args: unknown[]) => {
        if (isDev) console.debug(...args);
    },
};

// ================================
// Image Upload Validation
// ================================

// Tipos MIME permitidos para imágenes
const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
];

// Tamaño máximo de imagen (5MB)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export interface ImageValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Valida un archivo de imagen antes de subirlo
 * @param file - El archivo a validar
 * @param maxSize - Tamaño máximo en bytes (por defecto 5MB)
 * @returns Resultado de validación con mensaje de error si falla
 */
export function validateImageFile(
    file: File,
    maxSize: number = MAX_IMAGE_SIZE
): ImageValidationResult {
    // Validar tipo MIME
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: `Tipo de archivo no permitido. Solo se aceptan: JPG, PNG, GIF, WebP`,
        };
    }

    // Validar tamaño
    if (file.size > maxSize) {
        const maxMB = Math.round(maxSize / (1024 * 1024));
        return {
            valid: false,
            error: `La imagen es muy pesada (máximo ${maxMB}MB)`,
        };
    }

    // Validar extensión del nombre (doble verificación)
    const extension = file.name.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
    if (!extension || !allowedExtensions.includes(extension)) {
        return {
            valid: false,
            error: `Extensión de archivo no permitida. Solo se aceptan: ${allowedExtensions.join(", ")}`,
        };
    }

    return { valid: true };
}
