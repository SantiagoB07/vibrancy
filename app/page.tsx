import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center py-20 bg-gradient-to-b from-white to-gray-100">
        <h1 className="text-5xl font-bold mb-4 text-black">Bienvenido a <span className="text-blue-600">Vibrancy</span></h1>
        <p className="text-lg text-gray-600 mb-6">Encuentra los mejores productos al mejor precio</p>
        <Button size="lg">Explorar productos</Button>
      </section>

      {/* Productos destacados */}
      <section className="py-16 px-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {[1, 2, 3].map((id) => (
          <Card key={id} className="w-80">
            <CardContent className="p-4 text-center">
              <img
                src={`/producto/${id}.jpg`}
                alt={`Producto ${id}`}
                className="mx-auto mb-4 rounded-lg"
              />
              <h3 className="text-xl font-semibold">Producto {id}</h3>
              <p className="text-gray-600">Descripción breve.</p>
              <Link href={`/producto/${id}`}>
                <Button className="mt-4">Comprar</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-6 mt-auto">
        <p>© 2025 Vibrancy. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default App;
