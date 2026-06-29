import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';

const router = Router();

const CAMPOS_PERMITIDOS = [
  'nombre', 'ubicacion', 'tipo', 'fecha_inicio',
  'fecha_fin', 'presupuesto_estimado', 'estado', 'id_responsable',
] as const;

const ProyectoSchema = z.object({
  nombre: z.string().min(1),
  ubicacion: z.string().min(1),
  tipo: z.string().min(1),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  presupuesto_estimado: z.number().positive(),
  id_responsable: z.number().int().positive(),
});

// GET /api/proyectos
router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, u.nombre AS encargado
      FROM proyecto p
      LEFT JOIN usuario u ON p.id_responsable = u.id_usuario
      ORDER BY p.fecha_inicio DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/proyectos/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM proyecto WHERE id_proyecto = ?',
      [req.params.id]
    );
    const proyecto = (rows as unknown[])[0];
    if (!proyecto) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json(proyecto);
  } catch (err) {
    next(err);
  }
});

// POST /api/proyectos
router.post('/', async (req, res, next) => {
  try {
    const data = ProyectoSchema.parse(req.body);
    const [result] = await pool.query(
      `INSERT INTO proyecto
        (nombre, ubicacion, tipo, fecha_inicio, fecha_fin, presupuesto_estimado, estado, id_responsable)
       VALUES (?, ?, ?, ?, ?, ?, 'Creado', ?)`,
      [
        data.nombre, data.ubicacion, data.tipo,
        data.fecha_inicio, data.fecha_fin ?? null,
        data.presupuesto_estimado, data.id_responsable,
      ]
    );
    const id = (result as { insertId: number }).insertId;
    res.status(201).json({ id_proyecto: id, estado: 'Creado', ...data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/proyectos/:id
router.put('/:id', async (req, res, next) => {
  try {
    const data = ProyectoSchema.partial().parse(req.body);

    const entries = Object.entries(data).filter(([k]) =>
      (CAMPOS_PERMITIDOS as readonly string[]).includes(k)
    );
    if (entries.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });

    const setClause = entries.map(([k]) => `${k} = ?`).join(', ');
    const values = [...entries.map(([, v]) => v), req.params.id];

    await pool.query(`UPDATE proyecto SET ${setClause} WHERE id_proyecto = ?`, values);
    res.json({ message: 'Proyecto actualizado' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/proyectos/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM proyecto WHERE id_proyecto = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
