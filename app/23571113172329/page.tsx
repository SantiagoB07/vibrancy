import Image from "next/image";
export default function Contacto() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-500 to-teal-600 flex flex-col">    
      {/* Contenido que crece */}
      <div className="flex-1">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-primary-foreground">Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.</h1>
          <p className="text-primary-foreground/90">En el mundo tendréis aflicción; pero confiad, yo he vencido al mundo.</p>
        </div>
       
        <div className="w-[90%] mx-auto flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg p-6">
          <p className="text-secondary-foreground mx-auto mb-4">Mejor es ir a la casa del luto que a la casa del banquete, porque aquello es el fin de todos los hombres; y el que vive lo pondrá en su corazón.</p>
          <Image
            src="/images/04.png"
            alt="Fuente"
            width={300}
            height={200}
            className="imgHover custom-hover"
          />
        </div>
      </div>
      
      {/* Footer que siempre está abajo */}
      <footer className="p-10 bg-black/90 mt-auto">
        Las puertas de los ríos se abrirán, y el palacio será destruido.
      </footer>
    </main>
  )
}
