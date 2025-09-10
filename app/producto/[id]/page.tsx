export default function ProductoDetalle({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full bg-white shadow-xl rounded-2xl overflow-hidden">
        {/* Imagen */}
        <div className="bg-gray-100 flex items-center justify-center">
          <img
            src={`/producto${params.id}.jpg`}
            alt={`Producto ${params.id}`}
            className="object-cover h-96 w-full"
          />
        </div>

        {/* Detalles */}
        <div className="p-6 flex flex-col justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-4 text-black">Producto {params.id}</h1>
            <p className="text-gray-600 mb-6">
              Una descripción extensa sobre el producto {params.id}. Incluye
              características, beneficios y detalles técnicos.
            </p>
            <p className="text-3xl font-semibold text-green-600">$149.99</p>
          </div>
          <button className="mt-6 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition">
            Comprar ahora
          </button>
        </div>
      </div>
      {/* Productos relacionados */}
      <div className="mt-12 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Productos relacionados</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((rel) => (
            <div
              key={rel}
              className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition"
            >
              <img
                src={`/producto${rel}.jpg`}
                alt={`Producto ${rel}`}
                className="rounded mb-3 object-cover h-40 w-full"
              />
              <h3 className="font-semibold text-black">Producto relacionado {rel}</h3>
              <p className="text-sm text-gray-500">$89.99</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
