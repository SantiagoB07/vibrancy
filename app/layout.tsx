import type { Metadata } from "next";
import { Geist } from 'next/font/google';
import { Toaster } from 'sonner';
import "./globals.css";
import { AppLayout } from '@/components/layout/AppLayout';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Vibrancy Accesorios",
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
        <Toaster 
          position="top-right" 
          richColors 
          closeButton
          toastOptions={{
            style: {
              background: '#F9E3C8',
              border: '1px solid #B9804A',
              color: '#5E3A1E',
            },
          }}
        />
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
