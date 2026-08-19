import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';
import { requireRole } from '../middleware/auth';
import { ROLES_GESTION_OBRA, ROLES_DOC } from '../middleware/roles';

// Gestion de maquinaria (RF23/RF24/RF27/RF28). Se monta en /api/maquinaria.
const router = Router();

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/maquinaria -> equipos con totales de uso y fallas abiertas
router.get('/', async (_req, res, next) => {
  try {
    const [maqs] = await pool.query(
      `SELECT m.id_maquinaria, m.nombre, m.tipo, m.activa,
              COALESCE(SUM(r.horas_uso),0) AS horas,
              COALESCE(SUM(r.combustible_consumido),0) AS combustible,
              COALESCE(SUM(r.produccion_realizada),0) AS produccion
       FROM maquinaria m
       LEFT JOIN registro_maquinaria r ON r.id_maquinaria = m.id_maquinaria
       GROUP BY m.id_maquinaria, m.nombre, m.tipo, m.activa
       ORDER BY m.nombre`
    );
    const [fallasRows] = await pool.query(
      'SELECT id_maquinaria, COUNT(*) AS n FROM falla_maquinaria WHERE resuelto = 0 GROUP BY id_maquinaria'
    );
    const fallas: Record<number, number> = {};
    for (const f of fallasRows as { id_maquinaria: number; n: number }[]) fallas[f.id_maquinaria] = Number(f.n);

    const out = (maqs as Record<string, unknown>[]).map((m) => {
      const horas = Number(m.horas);
      const comb = Number(m.combustible);
      const prod = Number(m.produccion);
      return {
        id_maquinaria: Number(m.id_maquinaria),
        nombre: m.nombre,
        tipo: m.tipo,
        activa: Number(m.activa) === 1,
        horas, combustible: comb, produccion: prod,
        combustible_por_hora: horas > 0 ? parseFloat((comb / horas).toFixed(2)) : 0,
        produccion_por_hora: horas > 0 ? parseFloat((prod / horas).toFixed(2)) : 0,
        fallas_abiertas: fallas[Number(m.id_maquinaria)] ?? 0,
      };
    });
    res.json(out);
  } catch (err) { next(err); }
});

const MaquinariaSchema = z.object({ nombre: z.string().min(1), tipo: z.string().min(1) });

// POST /api/maquinaria
router.post('/', requireRole(...ROLES_GESTION_OBRA), async (req, res, next) => {
  try {
    const data = MaquinariaSchema.parse(req.body);
    const [result] = await pool.query('INSERT INTO maquinaria (nombre, tipo) VALUES (?, ?)',
      [data.nombre.trim(), data.tipo.trim()]);
    res.status(201).json({ id_maquinaria: (result as { insertId: number }).insertId, nombre: data.nombre.trim(), tipo: data.tipo.trim() });
  } catch (err) { next(err); }
});

// DELETE /api/maquinaria/:id
router.delete('/:id', requireRole(...ROLES_GESTION_OBRA), async (req, res, next) => {
  try {
    await pool.query('DELETE FROM maquinaria WHERE id_maquinaria = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

// GET /api/maquinaria/operarios -> rendimiento por operario (RF28)
// (debe ir ANTES de /:idMaq/... para no confundir 'operarios' con un id)
router.get('/operarios', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT operario, SUM(horas_uso) AS horas, SUM(produccion_realizada) AS produccion,
              SUM(combustible_consumido) AS combustible
       FROM registro_maquinaria
       WHERE operario IS NOT NULL AND LENGTH(TRIM(operario)) > 0
       GROUP BY operario ORDER BY produccion DESC`
    );
    const out = (rows as Record<string, unknown>[]).map((o) => {
      const horas = Number(o.horas);
      const prod = Number(o.produccion);
      return {
        operario: o.operario, horas, produccion: prod, combustible: Number(o.combustible),
        produccion_por_hora: horas > 0 ? parseFloat((prod / horas).toFixed(2)) : 0,
      };
    });
    res.json(out);
  } catch (err) { next(err); }
});

// GET /api/maquinaria/:idMaq/registros (RF23 + alerta RF24)
router.get('/:idMaq/registros', async (req, res, next) => {
  try {
    const [totRows] = await pool.query(
      'SELECT COALESCE(SUM(combustible_consumido),0) AS c, COALESCE(SUM(horas_uso),0) AS h FROM registro_maquinaria WHERE id_maquinaria = ? AND horas_uso > 0',
      [req.params.idMaq]
    );
    const tot = (totRows as { c: number; h: number }[])[0];
    const promedio = Number(tot.h) > 0 ? Number(tot.c) / Number(tot.h) : 0;

    const [rows] = await pool.query(
      'SELECT * FROM registro_maquinaria WHERE id_maquinaria = ? ORDER BY fecha DESC, id_registro DESC',
      [req.params.idMaq]
    );
    const out = (rows as Record<string, unknown>[]).map((r) => {
      const horas = Number(r.horas_uso);
      const cph = horas > 0 ? Number(r.combustible_consumido) / horas : 0;
      return {
        id_registro: Number(r.id_registro),
        id_maquinaria: Number(r.id_maquinaria),
        id_proyecto: r.id_proyecto !== null ? Number(r.id_proyecto) : null,
        fecha: r.fecha,
        operario: r.operario,
        horas_uso: horas,
        combustible_consumido: Number(r.combustible_consumido),
        produccion_realizada: Number(r.produccion_realizada),
        combustible_por_hora: parseFloat(cph.toFixed(2)),
        alerta_consumo: promedio > 0 && cph > promedio * 1.5,
      };
    });
    res.json(out);
  } catch (err) { next(err); }
});

const RegistroSchema = z.object({
  fecha: z.string().regex(FECHA, 'Formato esperado: YYYY-MM-DD'),
  operario: z.string().optional(),
  horas_uso: z.number().nonnegative(),
  combustible_consumido: z.number().nonnegative(),
  produccion_realizada: z.number().nonnegative(),
  id_proyecto: z.number().int().positive().optional(),
});

// POST /api/maquinaria/:idMaq/registros
router.post('/:idMaq/registros', requireRole(...ROLES_DOC), async (req, res, next) => {
  try {
    const [maq] = await pool.query('SELECT id_maquinaria FROM maquinaria WHERE id_maquinaria = ?', [req.params.idMaq]);
    if ((maq as unknown[]).length === 0) return res.status(404).json({ error: 'Maquinaria no encontrada' });

    const data = RegistroSchema.parse(req.body);
    const operario = data.operario?.trim() ? data.operario.trim() : null;
    const [result] = await pool.query(
      `INSERT INTO registro_maquinaria (id_maquinaria, id_proyecto, fecha, operario, horas_uso, combustible_consumido, produccion_realizada)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.params.idMaq, data.id_proyecto ?? null, data.fecha, operario, data.horas_uso, data.combustible_consumido, data.produccion_realizada]
    );
    res.status(201).json({ id_registro: (result as { insertId: number }).insertId });
  } catch (err) { next(err); }
});

// DELETE /api/maquinaria/registro/:id
router.delete('/registro/:id', requireRole(...ROLES_DOC), async (req, res, next) => {
  try {
    await pool.query('DELETE FROM registro_maquinaria WHERE id_registro = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

// GET /api/maquinaria/:idMaq/fallas (RF27)
router.get('/:idMaq/fallas', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM falla_maquinaria WHERE id_maquinaria = ? ORDER BY fecha DESC, id_falla DESC',
      [req.params.idMaq]
    );
    const out = (rows as Record<string, unknown>[]).map((f) => ({
      ...f,
      id_falla: Number(f.id_falla),
      id_maquinaria: Number(f.id_maquinaria),
      reemplazo: Number(f.reemplazo) === 1,
      resuelto: Number(f.resuelto) === 1,
    }));
    res.json(out);
  } catch (err) { next(err); }
});

const FallaSchema = z.object({
  fecha: z.string().regex(FECHA, 'Formato esperado: YYYY-MM-DD'),
  componente: z.string().optional(),
  descripcion: z.string().min(1),
  reemplazo: z.boolean().optional(),
  resuelto: z.boolean().optional(),
});

// POST /api/maquinaria/:idMaq/fallas
router.post('/:idMaq/fallas', requireRole(...ROLES_DOC), async (req, res, next) => {
  try {
    const [maq] = await pool.query('SELECT id_maquinaria FROM maquinaria WHERE id_maquinaria = ?', [req.params.idMaq]);
    if ((maq as unknown[]).length === 0) return res.status(404).json({ error: 'Maquinaria no encontrada' });

    const data = FallaSchema.parse(req.body);
    const comp = data.componente?.trim() ? data.componente.trim() : null;
    const [result] = await pool.query(
      'INSERT INTO falla_maquinaria (id_maquinaria, fecha, componente, descripcion, reemplazo, resuelto) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.idMaq, data.fecha, comp, data.descripcion.trim(), data.reemplazo ? 1 : 0, data.resuelto ? 1 : 0]
    );
    res.status(201).json({ id_falla: (result as { insertId: number }).insertId });
  } catch (err) { next(err); }
});

// DELETE /api/maquinaria/falla/:id
router.delete('/falla/:id', requireRole(...ROLES_DOC), async (req, res, next) => {
  try {
    await pool.query('DELETE FROM falla_maquinaria WHERE id_falla = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
