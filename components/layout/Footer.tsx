import { MessageCircle } from "lucide-react";
import { CONTACT, SOCIAL_LINKS, BRAND } from "@/lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
      <footer className="bg-gradient-to-r from-amber-900 to-orange-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Logo & Description */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl font-serif italic font-bold">
                Vibrancy
               </span>
              </div>
              <p className="text-amber-100 text-sm">
                {BRAND.TAGLINE}
              </p>
            </div>

            {/* Contacto */}
            <div>
              <h5 className="font-semibold mb-4 text-lg">Contacto</h5>
              <div className="space-y-2">
                <a
                    href={SOCIAL_LINKS.WHATSAPP}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-amber-100 hover:text-white transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-sm">WhatsApp</span>
                </a>
                <p className="text-amber-100 text-sm">Email: {CONTACT.EMAIL}</p>
                <p className="text-amber-100 text-sm">Tel: {CONTACT.PHONE}</p>
              </div>
            </div>

            {/* Síguenos */}
            <div>
              <h5 className="font-semibold mb-4 text-lg">Síguenos</h5>
              <div className="flex flex-col gap-2">
                <a
                    href={SOCIAL_LINKS.INSTAGRAM}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-100 hover:text-white transition-colors text-sm"
                >
                  Instagram
                </a>
                <a
                    href={SOCIAL_LINKS.WHATSAPP}
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
              © {currentYear} {BRAND.NAME}. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
  );
}