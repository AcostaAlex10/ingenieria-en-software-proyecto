import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';

const router = Router();

const AvanceSchema = z.object({
  cantidad_ejecutada: z.number().nonnegative(),
  porcentaje_avance: z.number().min(0).max(100),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
  observaciones: z.string().optional(),
});

// GET /api/planificacion/:planId/avances
router.get('/:planId/avances', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM avance_fisico WHERE id_planificacion = ? ORDER BY fecha DESC',
      [req.params.planId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/planificacion/:planId/avances/resumen
router.get('/:planId/avances/resumen', async (req, res, next) => {
  try {
    const [planRows] = await pool.query(
      'SELECT avance_esperado_total FROM planificacion WHERE id_planificacion = ?',
      [req.params.planId]
    );
    const plan = (planRows as { avance_esperado_total: number }[])[0];
    if (!plan) return res.status(404).json({ error: 'Planificación no encontrada' });

    const [avanceRows] = await pool.query(
      `SELECT
         COUNT(*) AS total_registros,
         MAX(porcentaje_avance) AS avance_real,
         MAX(fecha) AS ultimo_registro
       FROM avance_fisico
       WHERE id_planificacion = ?`,
      [req.params.planId]
    );
    const stats = (avanceRows as Record<string, unknown>[])[0];
    const avanceReal = Number(stats.avance_real ?? 0);
    const desvio = avanceReal - plan.avance_esperado_total;

    res.json({
      avance_esperado: plan.avance_esperado_total,
      avance_real: avanceReal,
      desvio_pp: parseFloat(desvio.toFixed(2)),
      total_registros: stats.total_registros,
      ultimo_registro: stats.ultimo_registro,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/planificacion/:planId/avances
router.post('/:planId/avances', async (req, res, next) => {
  try {
    // Verificar que la planificación exista
    const [planRows] = await pool.query(
      'SELECT id_planificacion, id_proyecto FROM planificacion WHERE id_planificacion = ?',
      [req.params.planId]
    );
    if ((planRows as unknown[]).length === 0) {
      return res.status(404).json({ error: 'Planificación no encontrada' });
    }

    const data = AvanceSchema.parse(req.body);
    const [result] = await pool.query(
      `INSERT INTO avance_fisico (cantidad_ejecutada, porcentaje_avance, fecha, observaciones, id_planificacion)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.cantidad_ejecutada,
        data.porcentaje_avance,
        data.fecha,
        data.observaciones ?? null,
        req.params.planId,
      ]
    );
    const id = (result as { insertId: number }).insertId;

    // Si es el primer avance, pasar el proyecto a EnEjecucion
    const plan = (planRows as { id_proyecto: number }[])[0];
    await pool.query(
      "UPDATE proyecto SET estado = 'EnEjecucion' WHERE id_proyecto = ? AND estado = 'Planificado'",
      [plan.id_proyecto]
    );

    res.status(201).json({ id_avance: id, id_planificacion: Number(req.params.planId), ...data });
  } catch (err) {
    next(err);
  }
});

// GET /api/avances/:id
router.get('/avance/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM avance_fisico WHERE id_avance = ?',
      [req.params.id]
    );
    const avance = (rows as unknown[])[0];
    if (!avance) return res.status(404).json({ error: 'Registro de avance no encontrado' });
    res.json(avance);
  } catch (err) {
    next(err);
  }
});

// PUT /api/avances/:id
router.put('/avance/:id', async (req, res, next) => {
  try {
    const data = AvanceSchema.partial().parse(req.body);
    const entries = Object.entries(data);
    if (entries.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });

    const setClause = entries.map(([k]) => `${k} = ?`).join(', ');
    const values = [...entries.map(([, v]) => v), req.params.id];

    await pool.query(`UPDATE avance_fisico SET ${setClause} WHERE id_avance = ?`, values);
    res.json({ message: 'Avance actualizado' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/avances/:id
router.delete('/avance/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM avance_fisico WHERE id_avance = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
