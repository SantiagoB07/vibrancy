import { MessageCircle } from "lucide-react";

export function Footer() {
  return (
      <footer className="bg-gradient-to-r from-amber-900 to-orange-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Logo & Description */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                {/*
                AQUÍ PUEDES PONER TU LOGO CIRCULAR
                <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
                  <img src="/logo-vibrancy.png" alt="Vibrancy" className="w-full h-full object-cover" />
                </div>
              */}
                <span className="text-2xl font-serif italic font-bold">
                Vibrancy
              </span>
              </div>
              <p className="text-amber-100 text-sm">
                Accesorios personalizados hechos con amor en Colombia
              </p>
            </div>

            {/* Contacto */}
            <div>
              <h5 className="font-semibold mb-4 text-lg">Contacto</h5>
              <div className="space-y-2">
                <a
                    href="https://wa.me/573001234567"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-amber-100 hover:text-white transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-sm">WhatsApp</span>
                </a>
                <p className="text-amber-100 text-sm">Email: info@vibrancy.com</p>
                <p className="text-amber-100 text-sm">Tel: +57 300 123 4567</p>
              </div>
            </div>

            {/* Síguenos */}
            <div>
              <h5 className="font-semibold mb-4 text-lg">Síguenos</h5>
              <div className="flex flex-col gap-2">
                <a
                    href="https://instagram.com/vibrancyaccesorios"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-100 hover:text-white transition-colors text-sm"
                >
                  Instagram
                </a>
                <a
                    href="https://facebook.com/vibrancyaccesorios"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-100 hover:text-white transition-colors text-sm"
                >
                  Facebook
                </a>
                <a
                    href="https://wa.me/573001234567"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-100 hover:text-white transition-colors text-sm"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-amber-800 mt-8 pt-8 text-center">
            <p className="text-amber-200 text-sm">
              © 2025 Vibrancy Accesorios. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
  );
}