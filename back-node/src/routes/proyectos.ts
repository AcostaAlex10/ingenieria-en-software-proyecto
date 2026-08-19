import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';
import { requireRole } from '../middleware/auth';
import { ROLES_GESTION_OBRA, debeOcultarCostos } from '../middleware/roles';

const router = Router();

// El frontend consume el contrato { id, nombre, tipo, ubicacion, encargado,
// fechaInicio, estado, avance, presupuesto }. Mapeamos las columnas de la BD
// (id_proyecto, fecha_inicio) a ese formato con alias.
const SELECT = `SELECT id_proyecto AS id, nombre, tipo, ubicacion, encargado,
                       fecha_inicio AS fechaInicio, estado, avance, presupuesto
                FROM proyecto`;

type ProyectoRow = {
  id: number; nombre: string; tipo: string; ubicacion: string; encargado: string;
  fechaInicio: string; estado: string; avance: number; presupuesto: number;
};

// Ajusta tipos: id como string y numericos como number (igual que el contrato PHP).
// RF20: si el usuario es Personal Tecnico se quita el presupuesto de la respuesta
// (no alcanza con ocultarlo en el front: la API no debe exponerlo).
function normalizar(fila: ProyectoRow, ocultarCostos = false) {
  const salida = {
    ...fila,
    id: String(fila.id),
    avance: Number(fila.avance),
    presupuesto: Number(fila.presupuesto),
  };
  if (ocultarCostos) {
    delete (salida as Partial<typeof salida>).presupuesto;
  }
  return salida;
}

const ProyectoSchema = z.object({
  nombre: z.string().min(1),
  ubicacion: z.string().min(1),
  tipo: z.string().min(1),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
  presupuesto: z.number().positive(),
  encargado: z.string().min(1),
  estado: z.string().optional(),
  avance: z.number().min(0).max(100).optional(),
});

// GET /api/proyectos?q=texto
router.get('/', async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    let rows;
    if (q) {
      const like = `%${q}%`;
      [rows] = await pool.query(
        `${SELECT} WHERE LOWER(nombre) LIKE LOWER(?) OR LOWER(ubicacion) LIKE LOWER(?)
         ORDER BY id_proyecto DESC`,
        [like, like]
      );
    } else {
      [rows] = await pool.query(`${SELECT} ORDER BY id_proyecto DESC`);
    }
    const ocultar = debeOcultarCostos(req.user?.rol);
    res.json((rows as ProyectoRow[]).map((f) => normalizar(f, ocultar)));
  } catch (err) {
    next(err);
  }
});

// GET /api/proyectos/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`${SELECT} WHERE id_proyecto = ?`, [req.params.id]);
    const proyecto = (rows as ProyectoRow[])[0];
    if (!proyecto) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json(normalizar(proyecto, debeOcultarCostos(req.user?.rol)));
  } catch (err) {
    next(err);
  }
});

// POST /api/proyectos
router.post('/', requireRole(...ROLES_GESTION_OBRA), async (req, res, next) => {
  try {
    const data = ProyectoSchema.parse(req.body);
    const [result] = await pool.query(
      `INSERT INTO proyecto (nombre, tipo, ubicacion, encargado, fecha_inicio, estado, avance, presupuesto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.nombre, data.tipo, data.ubicacion, data.encargado,
        data.fechaInicio, data.estado ?? 'planificacion',
        data.avance ?? 0, data.presupuesto,
      ]
    );
    const id = (result as { insertId: number }).insertId;
    const [rows] = await pool.query(`${SELECT} WHERE id_proyecto = ?`, [id]);
    res.status(201).json(normalizar((rows as ProyectoRow[])[0]));
  } catch (err) {
    next(err);
  }
});

// PUT /api/proyectos/:id
router.put('/:id', requireRole(...ROLES_GESTION_OBRA), async (req, res, next) => {
  try {
    const data = ProyectoSchema.partial().parse(req.body);

    const [actualRows] = await pool.query(`${SELECT} WHERE id_proyecto = ?`, [req.params.id]);
    const actual = (actualRows as ProyectoRow[])[0];
    if (!actual) return res.status(404).json({ error: 'Proyecto no encontrado' });

    await pool.query(
      `UPDATE proyecto SET nombre = ?, tipo = ?, ubicacion = ?, encargado = ?,
              fecha_inicio = ?, estado = ?, avance = ?, presupuesto = ?
       WHERE id_proyecto = ?`,
      [
        data.nombre ?? actual.nombre,
        data.tipo ?? actual.tipo,
        data.ubicacion ?? actual.ubicacion,
        data.encargado ?? actual.encargado,
        data.fechaInicio ?? actual.fechaInicio,
        data.estado ?? actual.estado,
        data.avance ?? actual.avance,
        data.presupuesto ?? actual.presupuesto,
        req.params.id,
      ]
    );
    const [rows] = await pool.query(`${SELECT} WHERE id_proyecto = ?`, [req.params.id]);
    res.json(normalizar((rows as ProyectoRow[])[0]));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/proyectos/:id
router.delete('/:id', requireRole(...ROLES_GESTION_OBRA), async (req, res, next) => {
  try {
    await pool.query('DELETE FROM proyecto WHERE id_proyecto = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
