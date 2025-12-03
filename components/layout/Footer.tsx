import { MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Copyright */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">
              <span className="text-orange-500">Vi</span>
              <span className="text-white">brancy</span>
            </span>
            <span className="text-gray-400 text-sm">
              © 2025
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a
              href="https://wa.me/573001234567"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">WhatsApp</span>
            </a>
            <a
              href="https://instagram.com/vibrancy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Instagram
            </a>
          </div>
        </div>

        {/* Bottom text */}
        <div className="mt-6 pt-6 border-t border-gray-800 text-center">
          <p className="text-gray-500 text-sm">
            Accesorios personalizados hechos con amor en Colombia
          </p>
        </div>
      </div>
    </footer>
  );
}
