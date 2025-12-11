import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

// Validar que la URL de redirección sea segura (solo rutas internas)
function getSafeRedirectUrl(next: string | null): string {
    if (!next) return "/";
    
    // Solo permitir rutas relativas que empiecen con /
    // Rechazar URLs absolutas, protocolo-relative (//), y rutas peligrosas
    if (
        !next.startsWith("/") ||
        next.startsWith("//") ||
        next.startsWith("/\\") ||
        next.includes("://")
    ) {
        return "/";
    }
    
    return next;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    const next = getSafeRedirectUrl(searchParams.get("next"));

    if (token_hash && type) {
        const supabase = await createClient();

        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        });
        if (!error) {
            // redirect user to specified redirect URL or root of app
            redirect(next);
        } else {
            // redirect the user to an error page with some instructions
            redirect(`/auth/error?error=${encodeURIComponent(error?.message)}`);
        }
    }

    // redirect the user to an error page with some instructions
    redirect("/auth/error?error=No%20token%20hash%20or%20type");
}
