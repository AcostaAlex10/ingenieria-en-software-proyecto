import { Link } from "react-router";
import { Button } from "./ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-9xl font-bold text-gray-300">404</h1>
      <h2 className="text-3xl font-bold text-foreforegroundound mt-4">Página no encontrada</h2>
      <p className="text-muted-foremuted-foregroundound mt-2 max-w-md">
        La página que estás buscando no existe o ha sido movida.
      </p>
      <div className="flex gap-4 mt-8">
        <Link to="/">
          <Button className="gap-2">
            <Home className="w-4 h-4" />
            Ir al Dashboard
          </Button>
        </Link>
        <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
      </div>
    </div>
  );
}
