import type { Metadata } from "next";
import { Geist } from 'next/font/google';
import "./globals.css";
import { AppLayout } from '@/components/layout/AppLayout';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Vibrancy - Accesorios Personalizados",
  description: "Llaveros, relicarios, placas de mascota y dijes personalizados. Hechos con amor en Colombia.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.className} antialiased`}>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
