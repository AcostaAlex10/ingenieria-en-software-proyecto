import { Router } from 'express';
import { pool } from '../config/db';

// Catalogo global de materiales (RF04). Se monta en /api/materiales.
const router = Router();

// GET /api/materiales
router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM material ORDER BY nombre');
    res.json(rows);
  } catch (err) { next(err); }
});

export default router;
