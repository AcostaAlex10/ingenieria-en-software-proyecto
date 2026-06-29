import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';

// Rutas anidadas bajo una obra: asistencias, incidencias, documentos,
// inactividades, excedentes y materiales asignados (con sus consumos).
// Se monta en /api/proyectos junto a los routers de proyectos y planificacion.
const router = Router();

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

// ---------- Asistencia del personal (RF06) ----------
const AsistenciaSchema = z.object({
  fecha: z.string().regex(FECHA, 'Formato esperado: YYYY-MM-DD'),
  trabajador: z.string().min(1),
  estado: z.enum(['presente', 'ausente', 'tarde']),
  justificacion: z.string().optional(),
});

router.get('/:id/asistencias', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM asistencia WHERE id_proyecto = ? ORDER BY fecha DESC, id_asistencia DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/:id/asistencias', async (req, res, next) => {
  try {
    const data = AsistenciaSchema.parse(req.body);
    const just = data.justificacion?.trim() ? data.justificacion.trim() : null;
    const [result] = await pool.query(
      'INSERT INTO asistencia (id_proyecto, fecha, trabajador, estado, justificacion) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, data.fecha, data.trabajador.trim(), data.estado, just]
    );
    const id = (result as { insertId: number }).insertId;
    res.status(201).json({ id_asistencia: id, id_proyecto: Number(req.params.id), ...data, justificacion: just });
  } catch (err) { next(err); }
});

router.delete('/asistencia/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM asistencia WHERE id_asistencia = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

// ---------- Incidencias externas (RF09) ----------
const IncidenciaSchema = z.object({
  fecha: z.string().regex(FECHA, 'Formato esperado: YYYY-MM-DD'),
  tipo: z.enum(['clima', 'falla_maquinaria', 'proveedor', 'otro']),
  gravedad: z.enum(['baja', 'media', 'alta']),
  descripcion: z.string().min(1),
  dias_retraso: z.number().int().nonnegative().optional(),
});

router.get('/:id/incidencias', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM incidencia WHERE id_proyecto = ? ORDER BY fecha DESC, id_incidencia DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/:id/incidencias', async (req, res, next) => {
  try {
    const data = IncidenciaSchema.parse(req.body);
    const dias = data.dias_retraso ?? 0;
    const [result] = await pool.query(
      'INSERT INTO incidencia (id_proyecto, fecha, tipo, gravedad, descripcion, dias_retraso) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, data.fecha, data.tipo, data.gravedad, data.descripcion.trim(), dias]
    );
    const id = (result as { insertId: number }).insertId;
    res.status(201).json({ id_incidencia: id, id_proyecto: Number(req.params.id), ...data, dias_retraso: dias });
  } catch (err) { next(err); }
});

router.delete('/incidencia/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM incidencia WHERE id_incidencia = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

// ---------- Documentacion (RF16) ----------
const DocumentoSchema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(['pdf', 'imagen', 'otro']),
  categoria: z.string().min(1),
  url: z.string().min(1),
  fecha_carga: z.string().regex(FECHA, 'Formato esperado: YYYY-MM-DD'),
});

router.get('/:id/documentos', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM documento WHERE id_proyecto = ? ORDER BY fecha_carga DESC, id_documento DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/:id/documentos', async (req, res, next) => {
  try {
    const data = DocumentoSchema.parse(req.body);
    const [result] = await pool.query(
      'INSERT INTO documento (id_proyecto, nombre, tipo, categoria, url, fecha_carga) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, data.nombre.trim(), data.tipo, data.categoria.trim(), data.url.trim(), data.fecha_carga]
    );
    const id = (result as { insertId: number }).insertId;
    res.status(201).json({ id_documento: id, id_proyecto: Number(req.params.id), ...data });
  } catch (err) { next(err); }
});

router.delete('/documento/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM documento WHERE id_documento = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

// ---------- Periodos de inactividad (RF25) ----------
const InactividadSchema = z.object({
  fecha_inicio: z.string().regex(FECHA, 'Formato esperado: YYYY-MM-DD'),
  fecha_fin: z.string().regex(FECHA).optional(),
  motivo: z.string().min(1),
});

router.get('/:id/inactividades', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM periodo_inactividad WHERE id_proyecto = ? ORDER BY fecha_inicio DESC, id_periodo DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/:id/inactividades', async (req, res, next) => {
  try {
    const data = InactividadSchema.parse(req.body);
    const fin = data.fecha_fin ?? null;
    const [result] = await pool.query(
      'INSERT INTO periodo_inactividad (id_proyecto, fecha_inicio, fecha_fin, motivo) VALUES (?, ?, ?, ?)',
      [req.params.id, data.fecha_inicio, fin, data.motivo.trim()]
    );
    const id = (result as { insertId: number }).insertId;
    res.status(201).json({ id_periodo: id, id_proyecto: Number(req.params.id), ...data, fecha_fin: fin });
  } catch (err) { next(err); }
});

router.delete('/inactividad/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM periodo_inactividad WHERE id_periodo = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

// ---------- Items excedentes (RF22) ----------
const ExcedenteSchema = z.object({
  descripcion: z.string().min(1),
  cantidad: z.number().nonnegative().optional(),
  unidad: z.string().optional(),
  fecha: z.string().regex(FECHA, 'Formato esperado: YYYY-MM-DD'),
  motivo: z.string().optional(),
});

router.get('/:id/excedentes', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM item_excedente WHERE id_proyecto = ? ORDER BY fecha DESC, id_item DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/:id/excedentes', async (req, res, next) => {
  try {
    const data = ExcedenteSchema.parse(req.body);
    const cantidad = data.cantidad ?? null;
    const unidad = data.unidad?.trim() ? data.unidad.trim() : null;
    const motivo = data.motivo?.trim() ? data.motivo.trim() : null;
    const [result] = await pool.query(
      'INSERT INTO item_excedente (id_proyecto, descripcion, cantidad, unidad, fecha, motivo) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, data.descripcion.trim(), cantidad, unidad, data.fecha, motivo]
    );
    const id = (result as { insertId: number }).insertId;
    res.status(201).json({ id_item: id, id_proyecto: Number(req.params.id), descripcion: data.descripcion.trim(), cantidad, unidad, fecha: data.fecha, motivo });
  } catch (err) { next(err); }
});

router.delete('/excedente/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM item_excedente WHERE id_item = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

// ---------- Materiales asignados a la obra y consumos (RF10/RF12) ----------
router.get('/:id/materiales', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT am.id_asignacion, am.id_material, m.nombre, m.unidad, am.cantidad_asignada,
              COALESCE(SUM(cm.cantidad_consumida), 0) AS consumido
       FROM asignacion_material am
       JOIN material m ON m.id_material = am.id_material
       LEFT JOIN consumo_material cm ON cm.id_asignacion = am.id_asignacion
       WHERE am.id_proyecto = ?
       GROUP BY am.id_asignacion, am.id_material, m.nombre, m.unidad, am.cantidad_asignada
       ORDER BY m.nombre`,
      [req.params.id]
    );
    const out = (rows as Record<string, unknown>[]).map((f) => {
      const asignada = Number(f.cantidad_asignada);
      const consumido = Number(f.consumido);
      return {
        id_asignacion: Number(f.id_asignacion),
        id_material: Number(f.id_material),
        nombre: f.nombre,
        unidad: f.unidad,
        cantidad_asignada: asignada,
        consumido,
        restante: parseFloat((asignada - consumido).toFixed(2)),
        excedido: consumido > asignada,
      };
    });
    res.json(out);
  } catch (err) { next(err); }
});

const AsignarMaterialSchema = z.object({
  id_material: z.number().int().positive(),
  cantidad_asignada: z.number().positive(),
});

router.post('/:id/materiales', async (req, res, next) => {
  try {
    const [proy] = await pool.query('SELECT id_proyecto FROM proyecto WHERE id_proyecto = ?', [req.params.id]);
    if ((proy as unknown[]).length === 0) return res.status(404).json({ error: 'Obra no encontrada' });

    const data = AsignarMaterialSchema.parse(req.body);

    const [mat] = await pool.query('SELECT id_material FROM material WHERE id_material = ?', [data.id_material]);
    if ((mat as unknown[]).length === 0) return res.status(404).json({ error: 'Material inexistente' });

    const [dup] = await pool.query(
      'SELECT id_asignacion FROM asignacion_material WHERE id_proyecto = ? AND id_material = ?',
      [req.params.id, data.id_material]
    );
    if ((dup as unknown[]).length > 0) return res.status(409).json({ error: 'Ese material ya está asignado a la obra' });

    const [result] = await pool.query(
      'INSERT INTO asignacion_material (id_proyecto, id_material, cantidad_asignada) VALUES (?, ?, ?)',
      [req.params.id, data.id_material, data.cantidad_asignada]
    );
    res.status(201).json({ id_asignacion: (result as { insertId: number }).insertId });
  } catch (err) { next(err); }
});

router.delete('/material/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM asignacion_material WHERE id_asignacion = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

router.get('/material/:id/consumos', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM consumo_material WHERE id_asignacion = ? ORDER BY fecha DESC, id_consumo DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

const ConsumoSchema = z.object({
  fecha: z.string().regex(FECHA, 'Formato esperado: YYYY-MM-DD'),
  cantidad_consumida: z.number().positive(),
  observaciones: z.string().optional(),
});

router.post('/material/:id/consumos', async (req, res, next) => {
  try {
    const [asig] = await pool.query('SELECT id_asignacion FROM asignacion_material WHERE id_asignacion = ?', [req.params.id]);
    if ((asig as unknown[]).length === 0) return res.status(404).json({ error: 'Asignación no encontrada' });

    const data = ConsumoSchema.parse(req.body);
    const obs = data.observaciones?.trim() ? data.observaciones.trim() : null;
    const [result] = await pool.query(
      'INSERT INTO consumo_material (id_asignacion, fecha, cantidad_consumida, observaciones) VALUES (?, ?, ?, ?)',
      [req.params.id, data.fecha, data.cantidad_consumida, obs]
    );
    res.status(201).json({ id_consumo: (result as { insertId: number }).insertId });
  } catch (err) { next(err); }
});

router.delete('/consumo/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM consumo_material WHERE id_consumo = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
