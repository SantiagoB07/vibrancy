// app/admin/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const ADMIN_EMAIL = "vibrancyaccesorios@gmail.com";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Verificar autenticación
    if (!user) {
        redirect("/auth/login?redirect=/admin");
    }

    // Verificar que sea admin
    if (user.email !== ADMIN_EMAIL) {
        redirect("/?error=unauthorized");
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Admin Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-8">
                            <Link href="/admin" className="font-bold text-xl text-primary">
                                Vibrancy Admin
                            </Link>
                            <nav className="hidden md:flex items-center gap-6">
                                <Link 
                                    href="/admin" 
                                    className="text-sm text-gray-600 hover:text-primary transition-colors"
                                >
                                    Dashboard
                                </Link>
                                <Link 
                                    href="/admin/orders" 
                                    className="text-sm text-gray-600 hover:text-primary transition-colors"
                                >
                                    Pedidos
                                </Link>
                            </nav>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">{user.email}</span>
                            <Link 
                                href="/" 
                                className="text-sm text-gray-600 hover:text-primary transition-colors"
                            >
                                Ver tienda
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
