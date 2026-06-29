import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';

// Reportes operativos con flujo de aprobacion (RF21/RF17).
// Ciclo: borrador -> en_revision -> aprobado | rechazado (-> en_revision).
const router = Router();

const SELECT = `SELECT r.id_reporte, r.id_proyecto, p.nombre AS proyecto, r.id_usuario,
                       u.nombre AS autor, r.titulo, r.contenido, r.estado,
                       r.observacion_revision, r.fecha_creacion, r.fecha_revision
                FROM reporte r
                JOIN proyecto p ON p.id_proyecto = r.id_proyecto
                JOIN usuario u ON u.id_usuario = r.id_usuario`;

type ReporteRow = { id_reporte: number; id_proyecto: number; id_usuario: number; estado: string } & Record<string, unknown>;

function normalizar(f: ReporteRow) {
  return { ...f, id_reporte: Number(f.id_reporte), id_proyecto: Number(f.id_proyecto), id_usuario: Number(f.id_usuario) };
}

async function buscarRaw(id: string) {
  const [rows] = await pool.query('SELECT * FROM reporte WHERE id_reporte = ?', [id]);
  return (rows as { estado: string }[])[0] ?? null;
}

async function devolver(res: import('express').Response, id: number, codigo: number) {
  const [rows] = await pool.query(`${SELECT} WHERE r.id_reporte = ?`, [id]);
  const fila = (rows as ReporteRow[])[0];
  if (!fila) return res.status(404).json({ error: 'Reporte no encontrado' });
  return res.status(codigo).json(normalizar(fila));
}

// GET /api/reportes[?estado=...]
router.get('/', async (req, res, next) => {
  try {
    const estado = typeof req.query.estado === 'string' ? req.query.estado : '';
    let rows;
    if (estado) {
      [rows] = await pool.query(`${SELECT} WHERE r.estado = ? ORDER BY r.fecha_creacion DESC`, [estado]);
    } else {
      [rows] = await pool.query(`${SELECT} ORDER BY r.fecha_creacion DESC`);
    }
    res.json((rows as ReporteRow[]).map(normalizar));
  } catch (err) { next(err); }
});

const CrearSchema = z.object({
  id_proyecto: z.number().int().positive(),
  titulo: z.string().min(1),
  contenido: z.string().min(1),
});

// POST /api/reportes  -> crea en borrador (autor = usuario del token)
router.post('/', async (req, res, next) => {
  try {
    const data = CrearSchema.parse(req.body);
    const [proy] = await pool.query('SELECT id_proyecto FROM proyecto WHERE id_proyecto = ?', [data.id_proyecto]);
    if ((proy as unknown[]).length === 0) return res.status(404).json({ error: 'Obra no encontrada' });

    const idUsuario = req.user?.id_usuario ?? null;
    if (!idUsuario) return res.status(401).json({ error: 'Iniciá sesión para crear un reporte' });

    const [result] = await pool.query(
      'INSERT INTO reporte (id_proyecto, id_usuario, titulo, contenido) VALUES (?, ?, ?, ?)',
      [data.id_proyecto, idUsuario, data.titulo.trim(), data.contenido.trim()]
    );
    return devolver(res, (result as { insertId: number }).insertId, 201);
  } catch (err) { next(err); }
});

const EditarSchema = z.object({ titulo: z.string().min(1), contenido: z.string().min(1) });

// PUT /api/reportes/:id  -> editar (solo borrador o rechazado)
router.put('/:id', async (req, res, next) => {
  try {
    const actual = await buscarRaw(req.params.id);
    if (!actual) return res.status(404).json({ error: 'Reporte no encontrado' });
    if (!['borrador', 'rechazado'].includes(actual.estado))
      return res.status(409).json({ error: 'Solo se puede editar un reporte en borrador o rechazado' });

    const data = EditarSchema.parse(req.body);
    await pool.query('UPDATE reporte SET titulo = ?, contenido = ? WHERE id_reporte = ?',
      [data.titulo.trim(), data.contenido.trim(), req.params.id]);
    return devolver(res, Number(req.params.id), 200);
  } catch (err) { next(err); }
});

// POST /api/reportes/:id/enviar  -> manda a revision
router.post('/:id/enviar', async (req, res, next) => {
  try {
    const actual = await buscarRaw(req.params.id);
    if (!actual) return res.status(404).json({ error: 'Reporte no encontrado' });
    if (!['borrador', 'rechazado'].includes(actual.estado))
      return res.status(409).json({ error: 'El reporte ya fue enviado a revisión' });
    await pool.query("UPDATE reporte SET estado = 'en_revision', observacion_revision = NULL WHERE id_reporte = ?", [req.params.id]);
    return devolver(res, Number(req.params.id), 200);
  } catch (err) { next(err); }
});

async function resolver(req: import('express').Request, res: import('express').Response, nuevoEstado: string, observacion: string | null) {
  const actual = await buscarRaw(req.params.id);
  if (!actual) return res.status(404).json({ error: 'Reporte no encontrado' });
  if (actual.estado !== 'en_revision')
    return res.status(409).json({ error: 'Solo se pueden resolver reportes en revisión' });
  await pool.query('UPDATE reporte SET estado = ?, observacion_revision = ?, fecha_revision = NOW() WHERE id_reporte = ?',
    [nuevoEstado, observacion, req.params.id]);
  return devolver(res, Number(req.params.id), 200);
}

// POST /api/reportes/:id/aprobar
router.post('/:id/aprobar', async (req, res, next) => {
  try {
    const obs = typeof req.body?.observacion === 'string' && req.body.observacion.trim() ? req.body.observacion.trim() : null;
    return await resolver(req, res, 'aprobado', obs);
  } catch (err) { next(err); }
});

// POST /api/reportes/:id/rechazar  (observacion obligatoria)
router.post('/:id/rechazar', async (req, res, next) => {
  try {
    const obs = typeof req.body?.observacion === 'string' ? req.body.observacion.trim() : '';
    if (!obs) return res.status(422).json({ errors: { observacion: 'Indicá el motivo del rechazo' } });
    return await resolver(req, res, 'rechazado', obs);
  } catch (err) { next(err); }
});

// DELETE /api/reportes/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM reporte WHERE id_reporte = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
