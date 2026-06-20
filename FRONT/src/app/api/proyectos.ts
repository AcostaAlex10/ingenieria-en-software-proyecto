// Cliente de API para Proyectos (RF01) y la informacion por obra (RF02:
// planificacion y avances). Usa apiFetch, que agrega el token y la URL base.
import { apiFetch } from "../auth/api";

export interface Proyecto {
  id: string;
  nombre: string;
  tipo: string;
  ubicacion: string;
  encargado: string;
  fechaInicio: string;
  estado: string;
  avance: number;
  presupuesto: number;
}

export type ProyectoInput = Omit<Proyecto, "id" | "avance" | "estado"> &
  Partial<Pick<Proyecto, "estado" | "avance">>;

export interface Planificacion {
  id_planificacion: number;
  avance_esperado_total: number;
  fecha_carga: string;
  id_proyecto: number;
}

export interface Avance {
  id_avance: number;
  id_planificacion: number;
  cantidad_ejecutada: number;
  porcentaje_avance: number;
  fecha: string;
  observaciones: string | null;
}

export interface Resumen {
  avance_esperado: number;
  avance_real: number;
  desvio_pp: number;
  total_registros: number;
  ultimo_registro: string | null;
}

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = data as { error?: string; errors?: Record<string, string> };
    // Errores por campo (422): los unimos en un mensaje legible.
    const porCampo = d.errors ? Object.values(d.errors).join(". ") : null;
    throw new Error(d.error ?? porCampo ?? "Error en la solicitud");
  }
  return data as T;
}

// ---------- Proyectos (RF01) ----------
export async function listarProyectos(busqueda?: string): Promise<Proyecto[]> {
  const q = busqueda ? `?q=${encodeURIComponent(busqueda)}` : "";
  return parse(await apiFetch(`/proyectos${q}`));
}
export async function crearProyecto(datos: ProyectoInput): Promise<Proyecto> {
  return parse(await apiFetch("/proyectos", { method: "POST", body: JSON.stringify(datos) }));
}
export async function actualizarProyecto(id: string, datos: Partial<ProyectoInput>): Promise<Proyecto> {
  return parse(await apiFetch(`/proyectos/${id}`, { method: "PUT", body: JSON.stringify(datos) }));
}
export async function eliminarProyecto(id: string): Promise<void> {
  await parse(await apiFetch(`/proyectos/${id}`, { method: "DELETE" }));
}
export async function obtenerProyecto(id: string): Promise<Proyecto> {
  return parse(await apiFetch(`/proyectos/${id}`));
}

// ---------- Planificacion (RF02) ----------
export async function obtenerPlanificacion(idProyecto: string): Promise<Planificacion | null> {
  const res = await apiFetch(`/proyectos/${idProyecto}/planificacion`);
  if (res.status === 404) return null;
  return parse(res);
}
export async function crearPlanificacion(
  idProyecto: string,
  datos: { avance_esperado_total: number; fecha_carga: string }
): Promise<Planificacion> {
  return parse(await apiFetch(`/proyectos/${idProyecto}/planificacion`, { method: "POST", body: JSON.stringify(datos) }));
}
export async function actualizarPlanificacion(
  idPlan: number,
  datos: { avance_esperado_total: number; fecha_carga: string }
): Promise<void> {
  await parse(await apiFetch(`/planificacion/${idPlan}`, { method: "PUT", body: JSON.stringify(datos) }));
}

// ---------- Avances fisicos (RF02) ----------
export async function listarAvances(idPlan: number): Promise<Avance[]> {
  return parse(await apiFetch(`/planificacion/${idPlan}/avances`));
}
export async function resumenAvances(idPlan: number): Promise<Resumen> {
  return parse(await apiFetch(`/planificacion/${idPlan}/avances/resumen`));
}
export async function crearAvance(
  idPlan: number,
  datos: { cantidad_ejecutada: number; porcentaje_avance: number; fecha: string; observaciones?: string }
): Promise<Avance> {
  return parse(await apiFetch(`/planificacion/${idPlan}/avances`, { method: "POST", body: JSON.stringify(datos) }));
}
