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

/** Etiqueta legible de un estado. Si llega uno desconocido, se muestra crudo
 *  en vez de inventar otro: es preferible que se note a que engañe. */
export function etiquetaEstado(estado: string): string {
  return ESTADOS_OBRA[estado]?.label ?? estado;
}

export function colorEstado(estado: string): string {
  return ESTADOS_OBRA[estado]?.color ?? "#64748b";
}
