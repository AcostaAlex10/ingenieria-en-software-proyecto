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

// Seguimiento operativo (Sprint 2)
export type EstadoAsistencia = "presente" | "ausente" | "tarde";
export interface Asistencia {
  id_asistencia: number;
  id_proyecto: number;
  fecha: string;
  trabajador: string;
  estado: EstadoAsistencia;
  justificacion: string | null;
}

export type TipoIncidencia = "clima" | "falla_maquinaria" | "proveedor" | "otro";
export type GravedadIncidencia = "baja" | "media" | "alta";
export interface Incidencia {
  id_incidencia: number;
  id_proyecto: number;
  fecha: string;
  tipo: TipoIncidencia;
  gravedad: GravedadIncidencia;
  descripcion: string;
  dias_retraso: number;
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

// ---------- Asistencia del personal (RF06) ----------
export async function listarAsistencias(idProyecto: string): Promise<Asistencia[]> {
  return parse(await apiFetch(`/proyectos/${idProyecto}/asistencias`));
}
export async function crearAsistencia(
  idProyecto: string,
  datos: { fecha: string; trabajador: string; estado: EstadoAsistencia; justificacion?: string }
): Promise<Asistencia> {
  return parse(await apiFetch(`/proyectos/${idProyecto}/asistencias`, { method: "POST", body: JSON.stringify(datos) }));
}
export async function eliminarAsistencia(idAsistencia: number): Promise<void> {
  await parse(await apiFetch(`/proyectos/asistencia/${idAsistencia}`, { method: "DELETE" }));
}

// ---------- Incidencias externas (RF09) ----------
export async function listarIncidencias(idProyecto: string): Promise<Incidencia[]> {
  return parse(await apiFetch(`/proyectos/${idProyecto}/incidencias`));
}
export async function crearIncidencia(
  idProyecto: string,
  datos: { fecha: string; tipo: TipoIncidencia; gravedad: GravedadIncidencia; descripcion: string; dias_retraso?: number }
): Promise<Incidencia> {
  return parse(await apiFetch(`/proyectos/${idProyecto}/incidencias`, { method: "POST", body: JSON.stringify(datos) }));
}
export async function eliminarIncidencia(idIncidencia: number): Promise<void> {
  await parse(await apiFetch(`/proyectos/incidencia/${idIncidencia}`, { method: "DELETE" }));
}
