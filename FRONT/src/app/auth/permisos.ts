// Permisos por rol en el frontend (RF19/RF20).
//
// IMPORTANTE: esto es solo para la experiencia de usuario (ocultar botones y
// datos que no corresponden). La seguridad REAL la aplica el backend, que
// vuelve a verificar el rol en cada operación. Nunca confiar solo en el front.

import { getUsuario } from "./session";

export type Rol =
  | "AdministradorSistema"
  | "PersonalAdministrativo"
  | "Gerente"
  | "PersonalTecnico";

/** Rol del usuario logueado (o cadena vacía si no hay sesión). */
export function rolActual(): string {
  return getUsuario()?.rol ?? "";
}

/** Crear/editar/eliminar obras y cargar planificación. */
export function puedeGestionarObras(rol: string = rolActual()): boolean {
  return rol === "AdministradorSistema" || rol === "PersonalAdministrativo";
}

/** Registrar/editar/eliminar avances físicos (el encargado de obra). */
export function puedeRegistrarAvance(rol: string = rolActual()): boolean {
  return rol === "AdministradorSistema" || rol === "PersonalTecnico";
}

/** Ver costos/presupuestos. RF20: el Personal Técnico NO los ve. */
export function puedeVerCostos(rol: string = rolActual()): boolean {
  return rol !== "PersonalTecnico";
}

/** Gestionar usuarios y asignar roles (solo el AdministradorSistema). */
export function puedeGestionarUsuarios(rol: string = rolActual()): boolean {
  return rol === "AdministradorSistema";
}

/** Cargar documentación de obra (todos los roles operativos, menos el Gerente que solo consulta). */
export function puedeCargarDocumentos(rol: string = rolActual()): boolean {
  return rol === "AdministradorSistema" || rol === "PersonalAdministrativo" || rol === "PersonalTecnico";
}
