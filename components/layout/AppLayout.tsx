"use client";

import React from "react";
import { Toaster } from "sonner";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
      
      <Footer />
      
      <Toaster richColors position="top-right" closeButton />
    </div>
  );
}
