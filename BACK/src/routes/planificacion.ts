import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';

const router = Router();

const PlanificacionSchema = z.object({
  avance_esperado_total: z.number().min(0).max(100),
  fecha_carga: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
});

// GET /api/proyectos/:proyectoId/planificacion
router.get('/:proyectoId/planificacion', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM planificacion WHERE id_proyecto = ?',
      [req.params.proyectoId]
    );
    const plan = (rows as unknown[])[0];
    if (!plan) return res.status(404).json({ error: 'Planificación no encontrada para este proyecto' });
    res.json(plan);
  } catch (err) {
    next(err);
  }
});

// POST /api/proyectos/:proyectoId/planificacion
router.post('/:proyectoId/planificacion', async (req, res, next) => {
  try {
    // Verificar que el proyecto exista
    const [proyectos] = await pool.query(
      'SELECT id_proyecto FROM proyecto WHERE id_proyecto = ?',
      [req.params.proyectoId]
    );
    if ((proyectos as unknown[]).length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Un proyecto solo puede tener una planificación
    const [existente] = await pool.query(
      'SELECT id_planificacion FROM planificacion WHERE id_proyecto = ?',
      [req.params.proyectoId]
    );
    if ((existente as unknown[]).length > 0) {
      return res.status(409).json({ error: 'El proyecto ya tiene una planificación. Usá PUT para modificarla.' });
    }

    const data = PlanificacionSchema.parse(req.body);
    const [result] = await pool.query(
      'INSERT INTO planificacion (avance_esperado_total, fecha_carga, id_proyecto) VALUES (?, ?, ?)',
      [data.avance_esperado_total, data.fecha_carga, req.params.proyectoId]
    );
    const id = (result as { insertId: number }).insertId;

    // Pasar proyecto a estado Planificado
    await pool.query(
      "UPDATE proyecto SET estado = 'Planificado' WHERE id_proyecto = ? AND estado = 'Creado'",
      [req.params.proyectoId]
    );

    res.status(201).json({ id_planificacion: id, id_proyecto: Number(req.params.proyectoId), ...data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/planificacion/:id
router.put('/:id', async (req, res, next) => {
  try {
    const data = PlanificacionSchema.partial().parse(req.body);
    const entries = Object.entries(data);
    if (entries.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });

    const setClause = entries.map(([k]) => `${k} = ?`).join(', ');
    const values = [...entries.map(([, v]) => v), req.params.id];

    await pool.query(`UPDATE planificacion SET ${setClause} WHERE id_planificacion = ?`, values);
    res.json({ message: 'Planificación actualizada' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/planificacion/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM planificacion WHERE id_planificacion = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
