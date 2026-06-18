import { Navigate, useLocation } from "react-router";
import { isAuthenticated } from "./session";

/**
 * Envuelve las rutas protegidas. Si NO hay sesion, redirige a /login.
 * Guardamos en "state.from" la ruta que se quiso visitar para poder volver
 * ahi despues de iniciar sesion.
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
