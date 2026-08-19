/**
 * Grupos de roles por tipo de operación (RF19).
 *
 * Replican exactamente la autorización que aplicaba el backend original:
 * cada ruta de ESCRITURA exige pertenecer a uno de estos grupos. Las lecturas
 * solo exigen estar autenticado.
 */

/** Crear/editar/eliminar obras, planificación, etapas, materiales y maquinaria. */
export const ROLES_GESTION_OBRA = ['AdministradorSistema', 'PersonalAdministrativo'];

/** Registrar avances, asistencia, incidencias y consumos (el encargado de obra). */
export const ROLES_AVANCE = ['AdministradorSistema', 'PersonalTecnico'];

/** Documentación, reportes, inactividad, excedentes y registros de maquinaria (todos menos Gerente). */
export const ROLES_DOC = ['AdministradorSistema', 'PersonalAdministrativo', 'PersonalTecnico'];

/** Aprobar o rechazar reportes (RF21). */
export const ROLES_REPORTE_APROBAR = ['AdministradorSistema', 'PersonalAdministrativo'];

/** Gestionar usuarios y asignar roles (HU16, completa RF19). */
export const ROLES_ADMIN = ['AdministradorSistema'];

/** RF20: el Personal Técnico no accede a información de costos. */
export function debeOcultarCostos(rol?: string): boolean {
  return rol === 'PersonalTecnico';
}
