import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas
  if (
      pathname === "/" ||
      pathname === "/products" ||
      pathname === "/contacto" ||
      pathname === "/personalizar-llavero" ||
      /^\/producto\/\d+(?:\/|$)/.test(pathname) ||
      pathname === "/cart" ||
      // ✅ página de consulta de pedido (link mágico)
      /^\/mi-pedido\/\d+(?:\/|$)/.test(pathname) ||
      // ✅ páginas de resultado de pago (Mercado Pago back_urls)
      pathname === "/checkout/success" ||
      pathname === "/checkout/failure" ||
      pathname === "/checkout/pending" ||
      // ✅ páginas de selección de método de pago
      pathname === "/checkout/payment-method" ||
      pathname === "/checkout/transfer" ||
      // ✅ endpoints públicos de pago / webhooks / órdenes
      pathname.startsWith("/api/checkout") ||
      pathname.startsWith("/api/mercadopago") ||
      pathname.startsWith("/api/webhooks") ||
      pathname.startsWith("/api/orders")
  ) {
    return NextResponse.next();
  }

  // Para el resto, aplicar autenticación
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|23571113172329).*)",
  ],
};
