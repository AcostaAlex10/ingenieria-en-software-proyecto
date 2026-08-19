import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';
import { requireRole } from '../middleware/auth';
import { ROLES_GESTION_OBRA } from '../middleware/roles';

const router = Router();

const EtapaBaseSchema = z.object({
  nombre:           z.string().min(1),
  peso_porcentual:  z.number().min(0).max(100),
  fecha_inicio:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_fin:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  presupuesto_base: z.number().nonnegative().optional(),
  orden:            z.number().int().nonnegative().optional(),
});

const EtapaSchema = EtapaBaseSchema.refine(
  (d) => d.fecha_fin >= d.fecha_inicio,
  { message: 'fecha_fin debe ser igual o posterior a fecha_inicio', path: ['fecha_fin'] }
);

const EtapaPartialSchema = EtapaBaseSchema.partial();

// Calcula el porcentaje esperado a hoy según las fechas de las etapas.
// Si no hay etapas devuelve el fallback (avance_esperado_total de la planificacion).
export async function calcularEsperadoHoy(planId: number, fallback: number): Promise<number> {
  const [rows] = await pool.query(
    'SELECT peso_porcentual, fecha_inicio, fecha_fin FROM etapa_planificacion WHERE id_planificacion = ? ORDER BY orden, id_etapa',
    [planId]
  );
  const etapas = rows as { peso_porcentual: number; fecha_inicio: string; fecha_fin: string }[];
  if (etapas.length === 0) return fallback;

  const hoy = new Date().toISOString().slice(0, 10);
  let esperado = 0;
  for (const e of etapas) {
    if (hoy < e.fecha_inicio) continue;           // no empezó
    if (hoy >= e.fecha_fin) {
      esperado += e.peso_porcentual;              // completada
    } else {
      const total = new Date(e.fecha_fin).getTime() - new Date(e.fecha_inicio).getTime();
      const transcurrido = new Date(hoy).getTime() - new Date(e.fecha_inicio).getTime();
      esperado += e.peso_porcentual * (transcurrido / total);
    }
  }
  return parseFloat(Math.min(esperado, 100).toFixed(2));
}

// Versión batch: calcula esperado para varios planId en una sola query.
export async function calcularEsperadoBatch(
  planIds: number[],
  fallbacks: Record<number, number>
): Promise<Record<number, number>> {
  if (planIds.length === 0) return {};
  const placeholders = planIds.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT id_planificacion, peso_porcentual, fecha_inicio, fecha_fin
     FROM etapa_planificacion WHERE id_planificacion IN (${placeholders})
     ORDER BY id_planificacion, orden, id_etapa`,
    planIds
  );
  type Row = { id_planificacion: number; peso_porcentual: number; fecha_inicio: string; fecha_fin: string };
  const byPlan: Record<number, Row[]> = {};
  for (const r of rows as Row[]) {
    (byPlan[r.id_planificacion] ??= []).push(r);
  }

  const hoy = new Date().toISOString().slice(0, 10);
  const result: Record<number, number> = {};
  for (const pid of planIds) {
    const etapas = byPlan[pid] ?? [];
    if (etapas.length === 0) { result[pid] = fallbacks[pid] ?? 0; continue; }
    let esperado = 0;
    for (const e of etapas) {
      if (hoy < e.fecha_inicio) continue;
      if (hoy >= e.fecha_fin) { esperado += e.peso_porcentual; }
      else {
        const total = new Date(e.fecha_fin).getTime() - new Date(e.fecha_inicio).getTime();
        const trans = new Date(hoy).getTime() - new Date(e.fecha_inicio).getTime();
        esperado += e.peso_porcentual * (trans / total);
      }
    }
    result[pid] = parseFloat(Math.min(esperado, 100).toFixed(2));
  }
  return result;
}

// GET /api/planificacion/:planId/etapas
router.get('/:planId/etapas', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM etapa_planificacion WHERE id_planificacion = ? ORDER BY orden, id_etapa',
      [req.params.planId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/planificacion/:planId/etapas
router.post('/:planId/etapas', requireRole(...ROLES_GESTION_OBRA), async (req, res, next) => {
  try {
    const planId = Number(req.params.planId);

    const [planRows] = await pool.query(
      'SELECT id_planificacion FROM planificacion WHERE id_planificacion = ?', [planId]
    );
    if ((planRows as unknown[]).length === 0)
      return res.status(404).json({ error: 'Planificación no encontrada' });

    // Validar que la suma de pesos no supere 100
    const [sumaRows] = await pool.query(
      'SELECT COALESCE(SUM(peso_porcentual), 0) AS suma FROM etapa_planificacion WHERE id_planificacion = ?',
      [planId]
    );
    const sumaActual = Number((sumaRows as { suma: number }[])[0].suma);

    const data = EtapaSchema.parse(req.body);
    const nuevoPeso = data.peso_porcentual;
    if (sumaActual + nuevoPeso > 100)
      return res.status(422).json({ error: `Suma de pesos superaría 100% (actual: ${sumaActual}%)` });

    const [countRows] = await pool.query(
      'SELECT COALESCE(MAX(orden), -1) + 1 AS siguiente FROM etapa_planificacion WHERE id_planificacion = ?',
      [planId]
    );
    const orden = data.orden ?? Number((countRows as { siguiente: number }[])[0].siguiente);

    const [result] = await pool.query(
      `INSERT INTO etapa_planificacion (id_planificacion, nombre, peso_porcentual, fecha_inicio, fecha_fin, orden, presupuesto_base)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [planId, data.nombre.trim(), nuevoPeso, data.fecha_inicio, data.fecha_fin, orden, data.presupuesto_base ?? 0]
    );
    const id = (result as { insertId: number }).insertId;

    res.status(201).json({
      id_etapa: id, id_planificacion: planId,
      nombre: data.nombre.trim(), peso_porcentual: nuevoPeso,
      fecha_inicio: data.fecha_inicio, fecha_fin: data.fecha_fin,
      orden, presupuesto_base: data.presupuesto_base ?? 0,
      suma_pesos: parseFloat((sumaActual + nuevoPeso).toFixed(2)),
    });
  } catch (err) { next(err); }
});

// PUT /api/planificacion/etapa/:id
router.put('/etapa/:id', requireRole(...ROLES_GESTION_OBRA), async (req, res, next) => {
  try {
    const [etapaRows] = await pool.query(
      'SELECT * FROM etapa_planificacion WHERE id_etapa = ?', [req.params.id]
    );
    const actual = (etapaRows as Record<string, unknown>[])[0];
    if (!actual) return res.status(404).json({ error: 'Etapa no encontrada' });

    const data = EtapaPartialSchema.parse(req.body);

    // Revalidar suma si cambia el peso
    if (data.peso_porcentual !== undefined) {
      const [sumaRows] = await pool.query(
        'SELECT COALESCE(SUM(peso_porcentual), 0) AS suma FROM etapa_planificacion WHERE id_planificacion = ? AND id_etapa != ?',
        [actual.id_planificacion, req.params.id]
      );
      const sumaOtras = Number((sumaRows as { suma: number }[])[0].suma);
      if (sumaOtras + data.peso_porcentual > 100)
        return res.status(422).json({ error: `Suma de pesos superaría 100% (otras etapas: ${sumaOtras}%)` });
    }

    await pool.query(
      `UPDATE etapa_planificacion SET
         nombre = ?, peso_porcentual = ?, fecha_inicio = ?, fecha_fin = ?, orden = ?, presupuesto_base = ?
       WHERE id_etapa = ?`,
      [
        data.nombre?.trim()       ?? actual.nombre,
        data.peso_porcentual      ?? actual.peso_porcentual,
        data.fecha_inicio         ?? actual.fecha_inicio,
        data.fecha_fin            ?? actual.fecha_fin,
        data.orden                ?? actual.orden,
        data.presupuesto_base     ?? actual.presupuesto_base,
        req.params.id,
      ]
    );
    res.json({ message: 'Etapa actualizada' });
  } catch (err) { next(err); }
});

// DELETE /api/planificacion/etapa/:id
router.delete('/etapa/:id', requireRole(...ROLES_GESTION_OBRA), async (req, res, next) => {
  try {
    await pool.query('DELETE FROM etapa_planificacion WHERE id_etapa = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
