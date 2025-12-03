import Image from "next/image";
import Link from "next/link";

export default function CheckoutPendingPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-[#E6C29A] px-4">
            <div className="max-w-md w-full bg-[#F9E3C8] rounded-3xl shadow-2xl border border-[#B9804A]/30 p-8 text-center">
                {/* Logo */}
                <div className="flex justify-center mb-4">
                    <div className="relative w-20 h-20">
                        <Image
                            src="/images/vibrancy-logo.png"
                            alt="Vibrancy Accesorios"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>

                <h1 className="text-2xl font-semibold text-[#5E3A1E] mb-2">
                    Tu pago está en proceso ⏳
                </h1>

                <p className="text-sm text-[#6F4A2A] mb-6">
                    El pago quedó pendiente de confirmación por el banco o el medio de pago
                    que elegiste.
                    Apenas se acredite, te enviaremos la confirmación a tu correo.
                </p>

                <div className="mb-6 text-xs text-[#7C5431]">
                    No necesitas hacer nada más por ahora. Si ves algo raro en tu estado
                    de cuenta, contáctanos y revisamos contigo.
                </div>

                <Link
                    href={"/products"}
                    className="inline-flex items-center justify-center w-full py-2.5 rounded-full bg-[#5E3A1E] text-[#F9E3C8] text-sm font-medium hover:bg-[#4C2F18] transition"
                >
                    Volver a la tienda
                </Link>
            </div>
        </main>
    );
}
