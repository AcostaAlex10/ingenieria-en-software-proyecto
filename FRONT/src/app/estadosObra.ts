// Los siete estados de `proyecto.estado`, con la etiqueta que ve el usuario.
//
// La base los guarda en snake_case (`en_ejecucion`) y eso no se muestra tal
// cual en ninguna pantalla. Vive acá y no en cada componente para que el
// Dashboard, el listado de obras y el detalle no se contradigan entre sí.

export interface EstadoObra {
  label: string;
  /** Color del sector en los gráficos y de la insignia donde corresponde. */
  color: string;
}

export const ESTADOS_OBRA: Record<string, EstadoObra> = {
  creada: { label: "Creada", color: "#94a3b8" },
  planificacion: { label: "Planificación", color: "#3b82f6" },
  en_ejecucion: { label: "En ejecución", color: "#22c55e" },
  pausada: { label: "Pausada", color: "#ef4444" },
  en_revision: { label: "En revisión", color: "#f59e0b" },
  finalizada: { label: "Finalizada", color: "#a855f7" },
  cancelada: { label: "Cancelada", color: "#78716c" },
};

// Cancelar es el único cambio de estado que hace una persona a mano. El resto
// los mueve el sistema: `AvanceController` con los avances físicos e
// `InactividadController` con los períodos de parada. Por eso el formulario de
// obra ofrece `cancelada` y nada más.
//
// El TP3 traza la cancelación desde EnEjecucion y desde Pausado, no desde una
// obra que todavía no arrancó ni desde una terminada. `ProyectoController`
// valida lo mismo del lado del servidor; si cambiás esto, cambialo allá.
export const ESTADOS_CANCELABLES = ["en_ejecucion", "pausada"];

/** Si una obra en este estado puede cancelarse (TP3: decisión gerencial). */
export function sePuedeCancelar(estado: string): boolean {
  return ESTADOS_CANCELABLES.includes(estado);
}

/** Etiqueta legible de un estado. Si llega uno desconocido, se muestra crudo
 *  en vez de inventar otro: es preferible que se note a que engañe. */
export function etiquetaEstado(estado: string): string {
  return ESTADOS_OBRA[estado]?.label ?? estado;
}

export function colorEstado(estado: string): string {
  return ESTADOS_OBRA[estado]?.color ?? "#64748b";
}
