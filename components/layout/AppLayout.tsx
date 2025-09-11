import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Home, Package, Tag, Settings, User } from "lucide-react"
import Link from "next/link"

interface AppLayoutProps {
  children: React.ReactNode
}

const menuItems = [
  {
    title: "Inicio",
    url: "/",
    icon: Home,
  },
  {
    title: "Productos",
    url: "/products",
    icon: Package,
  },
  {
    title: "Ofertas",
    url: "/offers",
    icon: Tag,
  },
  {
    title: "Configuración",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  return (
    <Sidebar className="w-48 bg-background border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold">
            <span className="text-blue-600">Vi</span>brancy
          </span>
        </div>
      </SidebarHeader>
     
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
                {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link  href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Cuenta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Mi Perfil</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t p-4">
        <div className="text-xs text-muted-foreground text-right">
          © 2025 Vibrancy
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header con trigger movido a la derecha del sidebar */}
          <header className="border-b bg-background p-4 relative z-10">
            <div className="flex items-center gap-4">
              {/* El trigger ahora está claramente en el área del contenido principal */}
              <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground p-2 rounded-md transition-colors" />
              <span className="text-lg font-bold">
                <span className="text-blue-600">Vi</span>brancy
              </span>
            </div>
          </header>
         
          {/* Contenido principal */}
          <main className="flex-1 overflow-auto p-4">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}