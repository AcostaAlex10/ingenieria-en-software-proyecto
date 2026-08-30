import { createBrowserRouter, createHashRouter } from "react-router";
import Root from "./components/Root";
import LoginPage from "./components/LoginPage";
import OlvidePage from "./components/OlvidePage";
import RestablecerPage from "./components/RestablecerPage";
import RequireAuth from "./auth/RequireAuth";
import Dashboard from "./components/Dashboard";
import ProyectosPage from "./components/ProyectosPage";
import ProyectoDetallePage from "./components/ProyectoDetallePage";
import SeguimientoPage from "./components/SeguimientoPage";
import MaterialesPage from "./components/MaterialesPage";
import DocumentacionPage from "./components/DocumentacionPage";
import ReportesPage from "./components/ReportesPage";
import AlertasPage from "./components/AlertasPage";
import MaquinariaPage from "./components/MaquinariaPage";
import UsuariosPage from "./components/UsuariosPage";
import NotFound from "./components/NotFound";

// Prefijo del sitio. Es "/" en Vercel y "/<repo>/" en GitHub Pages; Vite lo
// expone en BASE_URL a partir de la opcion `base`. React Router lo necesita
// como basename o las rutas quedarian colgando de la raiz equivocada.
const BASENAME = (
  (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "/"
).replace(/\/$/, "");

// Con VITE_HASH_ROUTER=1 las rutas viajan en el fragmento (#/proyectos) en vez
// del path. Sirve para abrir la demo desde un archivo suelto o un visor que no
// puede devolver index.html en cada ruta; sin eso, entrar a /proyectos o
// recargar da 404. En Vercel y en local se sigue usando el router normal.
const USAR_HASH =
  (import.meta as unknown as { env?: { VITE_HASH_ROUTER?: string } }).env?.VITE_HASH_ROUTER === "1";

const crearRouter = USAR_HASH ? createHashRouter : createBrowserRouter;

export const router = crearRouter([
  // Rutas publicas (sin sidebar/layout).
  { path: "/login", Component: LoginPage },
  { path: "/olvide", Component: OlvidePage },
  { path: "/restablecer", Component: RestablecerPage },
  // Todo lo demas queda protegido: RequireAuth redirige a /login si no hay sesion.
  {
    path: "/",
    element: (
      <RequireAuth>
        <Root />
      </RequireAuth>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "proyectos", Component: ProyectosPage },
      { path: "proyectos/:id", Component: ProyectoDetallePage },
      { path: "seguimiento", Component: SeguimientoPage },
      { path: "materiales", Component: MaterialesPage },
      { path: "documentacion", Component: DocumentacionPage },
      { path: "reportes", Component: ReportesPage },
      { path: "alertas", Component: AlertasPage },
      { path: "maquinaria", Component: MaquinariaPage },
      { path: "usuarios", Component: UsuariosPage },
      { path: "*", Component: NotFound },
    ],
  },
  // Con hash el prefijo del sitio queda antes del '#', asi que el router no
  // debe volver a aplicarlo.
], { basename: USAR_HASH ? undefined : BASENAME || undefined });
