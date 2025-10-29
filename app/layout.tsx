import type { Metadata } from "next";
import { Geist, Inter, Lobster,  Coming_Soon , Pacifico, Tangerine } from 'next/font/google';

export const inter = Inter({ subsets: ['latin'], weight: ['400', '700'] });
export const lobster = Lobster({ subsets: ['latin'], weight: ['400'] });
export const robotoSlab = Coming_Soon({ subsets: ['latin'], weight: ['400'] });
export const pacifico = Pacifico({ subsets: ['latin'], weight: ['400'] });
export const tangerine = Tangerine({ subsets: ['latin'], weight: ['400', '700'] });

import { ThemeProvider } from "next-themes";
import "./globals.css";
import { AppLayout } from '@/components/layout/AppLayout'

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "ShopMate - Next.js and Supabase Starter Kit",
  description: "Encuentra los mejores productos al mejor precio",
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <AppLayout>
            {children}
          </AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}