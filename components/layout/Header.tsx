"use client";

import Link from "next/link";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/products", label: "Productos" },
  { href: "https://wa.me/573001234567", label: "Contacto", external: true },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hardcoded cart count for now
  const cartCount = 2;

  return (
      <header className="sticky top-0 z-50 bg-[#f5e6d3] shadow-md border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <img
                src="/images/vibrancy-logo.png"
                alt="Vibrancy"
                className="h-12 w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                  link.external ? (
                      <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-900 hover:text-amber-700 transition-colors font-medium"
                      >
                        {link.label}
                      </a>
                  ) : (
                      <Link
                          key={link.href}
                          href={link.href}
                          className="text-amber-900 hover:text-amber-700 transition-colors font-medium"
                      >
                        {link.label}
                      </Link>
                  )
              ))}
            </nav>

            {/* Cart + Mobile Menu Button */}
            <div className="flex items-center gap-4">
              {/* Cart */}
              <Link href="/cart" className="relative p-2 hover:bg-amber-200 rounded-full transition-colors">
                <ShoppingCart className="h-6 w-6 text-amber-900" />
                {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-900 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
                )}
              </Link>

              {/* Mobile Menu Button */}
              <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 hover:bg-amber-200 rounded-full transition-colors"
              >
                {mobileMenuOpen ? (
                    <X className="h-6 w-6 text-amber-900" />
                ) : (
                    <Menu className="h-6 w-6 text-amber-900" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
              <nav className="md:hidden py-4 border-t border-amber-200">
                <div className="flex flex-col gap-2">
                  {navLinks.map((link) => (
                      link.external ? (
                          <a
                              key={link.href}
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-3 text-amber-900 hover:text-amber-700 hover:bg-amber-200 rounded-lg transition-colors font-medium"
                              onClick={() => setMobileMenuOpen(false)}
                          >
                            {link.label}
                          </a>
                      ) : (
                          <Link
                              key={link.href}
                              href={link.href}
                              className="px-4 py-3 text-amber-900 hover:text-amber-700 hover:bg-amber-200 rounded-lg transition-colors font-medium"
                              onClick={() => setMobileMenuOpen(false)}
                          >
                            {link.label}
                          </Link>
                      )
                  ))}
                </div>
              </nav>
          )}
        </div>
      </header>
  );
}