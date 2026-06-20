import { createBrowserRouter } from "react-router";
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
import NotFound from "./components/NotFound";

export const router = createBrowserRouter([
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
      { path: "*", Component: NotFound },
    ],
  },
]);
