import { Router } from 'express';
import { pool } from '../config/db';
import { calcularEsperadoBatch } from './etapas';

const router = Router();

// GET /api/analisis
// Devuelve resumen de todos los proyectos con desvios de avance y comparativa presupuestaria.
// Usado por AlertasPage (RF11, RF13).
router.get('/', async (req, res, next) => {
  try {
    // Rol del usuario autenticado (inyectado por el middleware de auth si existe)
    const rol = (req as unknown as { user?: { rol?: string } }).user?.rol ?? '';
    const ocultarCostos = rol === 'PersonalTecnico';

    // Proyectos con planificacion (LEFT JOIN para incluir los que no tienen)
    const [proyectos] = await pool.query(`
      SELECT p.id_proyecto, p.nombre, p.estado,
             pl.id_planificacion, pl.avance_esperado_total
      FROM proyecto p
      LEFT JOIN planificacion pl ON pl.id_proyecto = p.id_proyecto
      ORDER BY p.nombre
    `);

    // Avance real por proyecto (MAX de porcentaje_avance en avance_fisico)
    const [avanceRows] = await pool.query(`
      SELECT pl.id_proyecto, MAX(af.porcentaje_avance) AS avance_real
      FROM avance_fisico af
      JOIN planificacion pl ON af.id_planificacion = pl.id_planificacion
      GROUP BY pl.id_proyecto
    `);
    const avancePorProyecto: Record<number, number> = {};
    for (const r of avanceRows as { id_proyecto: number; avance_real: number }[]) {
      avancePorProyecto[r.id_proyecto] = Number(r.avance_real);
    }

    // Calcular esperado por etapas (batch)
    type PlanRow = { id_proyecto: number; nombre: string; estado: string; id_planificacion: number | null; avance_esperado_total: number };
    const filas = proyectos as PlanRow[];
    const planIds: number[] = [];
    const fallbacks: Record<number, number> = {};
    for (const f of filas) {
      if (f.id_planificacion !== null) {
        planIds.push(f.id_planificacion);
        fallbacks[f.id_planificacion] = f.avance_esperado_total;
      }
    }
    const esperadosPorPlan = await calcularEsperadoBatch(planIds, fallbacks);

    // Materiales excedidos por proyecto (RF12)
    const [excRows] = await pool.query(`
      SELECT om.id_proyecto, COUNT(*) AS cantidad
      FROM asignacion_material om
      WHERE om.cantidad_consumida > om.cantidad_asignada
      GROUP BY om.id_proyecto
    `).catch(() => [[]] as [unknown[]]);
    const excedidosPorProyecto: Record<number, number> = {};
    for (const r of excRows as { id_proyecto: number; cantidad: number }[]) {
      excedidosPorProyecto[r.id_proyecto] = Number(r.cantidad);
    }

    // Presupuesto base total por proyecto (solo si no es técnico)
    const presupuestoBasePorProyecto: Record<number, number> = {};
    if (!ocultarCostos && planIds.length > 0) {
      const ph = planIds.map(() => '?').join(',');
      const [pbRows] = await pool.query(
        `SELECT pl.id_proyecto, COALESCE(SUM(ep.presupuesto_base), 0) AS presupuesto_base_total
         FROM planificacion pl
         JOIN etapa_planificacion ep ON ep.id_planificacion = pl.id_planificacion
         WHERE pl.id_planificacion IN (${ph})
         GROUP BY pl.id_proyecto`,
        planIds
      );
      for (const r of pbRows as { id_proyecto: number; presupuesto_base_total: number }[]) {
        presupuestoBasePorProyecto[r.id_proyecto] = Number(r.presupuesto_base_total);
      }
    }

    // Presupuesto del proyecto (columna puede ser presupuesto_estimado o presupuesto)
    const [presRows] = await pool.query(
      'SELECT id_proyecto, presupuesto_estimado AS presupuesto FROM proyecto'
    ).catch(() =>
      pool.query('SELECT id_proyecto, presupuesto FROM proyecto')
    );
    const presupuestoPorProyecto: Record<number, number> = {};
    for (const r of presRows as { id_proyecto: number; presupuesto: number }[]) {
      presupuestoPorProyecto[r.id_proyecto] = Number(r.presupuesto);
    }

    const resultProyectos = [];
    const alertas: { tipo: string; gravedad: string; proyecto: string; mensaje: string }[] = [];

    for (const f of filas) {
      const idP = f.id_proyecto;
      const avanceReal = avancePorProyecto[idP] ?? 0;
      const esperado = f.id_planificacion !== null
        ? (esperadosPorPlan[f.id_planificacion] ?? null)
        : null;
      const desvio = esperado !== null ? parseFloat((avanceReal - esperado).toFixed(2)) : null;
      const alertaAvance = esperado !== null && avanceReal < esperado;

      const item: Record<string, unknown> = {
        id_proyecto: idP,
        nombre: f.nombre,
        estado: f.estado,
        avance_real: avanceReal,
        avance_esperado: esperado,
        desvio_avance: desvio,
        alerta_avance: alertaAvance,
        materiales_excedidos: excedidosPorProyecto[idP] ?? 0,
      };

      if (!ocultarCostos) {
        const presupuesto = presupuestoPorProyecto[idP] ?? 0;
        const ejecutado = parseFloat((presupuesto * avanceReal / 100).toFixed(2));
        item.presupuesto = presupuesto;
        item.ejecutado = ejecutado;
        item.diferencia = parseFloat((presupuesto - ejecutado).toFixed(2));
        const pbTotal = presupuestoBasePorProyecto[idP];
        item.presupuesto_base_total = pbTotal ?? null;
      }

      resultProyectos.push(item);

      // Generar alertas
      if (alertaAvance) {
        alertas.push({
          tipo: 'avance',
          gravedad: Math.abs(desvio!) > 10 ? 'alta' : 'media',
          proyecto: f.nombre,
          mensaje: `Atraso de ${Math.abs(desvio!)} pp respecto al cronograma`,
        });
      }
      if ((excedidosPorProyecto[idP] ?? 0) > 0) {
        alertas.push({
          tipo: 'material',
          gravedad: 'media',
          proyecto: f.nombre,
          mensaje: `${excedidosPorProyecto[idP]} material(es) con consumo excedido`,
        });
      }
    }

    res.json({ proyectos: resultProyectos, alertas });
  } catch (err) {
    next(err);
  }
});

export default router;
