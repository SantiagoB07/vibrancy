"use client";

import React from "react";

export interface CustomerData {
    name: string;
    phone: string;
    email: string;
    address: string;
    neighborhood?: string | null;
    locality: string;
}

// Función de validación de email exportada para usar en otros componentes
export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

interface Props {
    data: CustomerData;
    onChange: (updated: CustomerData) => void;
}

export function CustomerForm({ data, onChange }: Props) {

    const update = (field: keyof CustomerData, value: string) => {
        onChange({
            ...data,
            [field]: value,
        });
    };

    return (
        <div className="max-w-md mx-auto space-y-4">
            <h2 className="text-lg font-semibold text-center text-zinc-900 mb-2">
                Datos para tu envío
            </h2>

            <p className="text-xs text-center text-zinc-600 mb-4">
                Usamos esta información solo para coordinar la entrega de tu pedido. No necesitas crear una cuenta.
            </p>

            {/* Nombre */}
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nombre completo
                </label>
                <input
                    type="text"
                    value={data.name}
                    onChange={(e) => update("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: Laura Martínez"
                />
            </div>

            {/* Celular */}
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                    Celular
                </label>
                <input
                    type="tel"
                    value={data.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: 300 123 4567"
                />
            </div>

            {/* Email */}
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                    Correo electrónico <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                    type="email"
                    value={data.email}
                    onChange={(e) => update("email", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: tu_correo@email.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Si lo agregas, te enviaremos actualizaciones de tu pedido.
                </p>
            </div>

            {/* Dirección */}
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                    Dirección
                </label>
                <input
                    type="text"
                    value={data.address}
                    onChange={(e) => update("address", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: Calle 123 #45-67, apto 301"
                />
            </div>

            {/* Barrio */}
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                    Barrio
                </label>
                <input
                    type="text"
                    value={data.neighborhood ?? ""}
                    onChange={(e) => update("neighborhood", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: Cedritos"
                />
            </div>

            {/* Localidad */}
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                    Localidad / Ciudad
                </label>
                <input
                    type="text"
                    value={data.locality}
                    onChange={(e) => update("locality", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: Usaquén, Bogotá"
                />
            </div>
        </div>
    );
}
