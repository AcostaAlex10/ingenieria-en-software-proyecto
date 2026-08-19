import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';
import { requireRole } from '../middleware/auth';
import { ROLES_ADMIN } from '../middleware/roles';

/**
 * Gestión de usuarios (HU16, completa RF19). Solo el AdministradorSistema.
 * El alta se hace por POST /api/auth/register; acá van el listado, el cambio
 * de rol y la baja lógica. Nunca se devuelve el hash de la contraseña.
 */
const router = Router();

// Todo este router es exclusivo del AdministradorSistema.
router.use(requireRole(...ROLES_ADMIN));

const ROLES = [
  'PersonalAdministrativo',
  'PersonalTecnico',
  'Gerente',
  'AdministradorSistema',
] as const;

// GET /api/usuarios
router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_usuario, nombre, email, rol, activo, fecha_creacion FROM usuario ORDER BY nombre'
    );
    const out = (rows as Record<string, unknown>[]).map((u) => ({
      ...u,
      id_usuario: Number(u.id_usuario),
      activo: Number(u.activo) === 1,
    }));
    res.json(out);
  } catch (err) { next(err); }
});

const ActualizarSchema = z
  .object({
    rol: z.enum(ROLES).optional(),
    activo: z.boolean().optional(),
  })
  .refine((d) => d.rol !== undefined || d.activo !== undefined, {
    message: 'Indicá al menos un campo para actualizar (rol o activo)',
  });

// PUT /api/usuarios/:id  -> cambiar rol y/o dar de baja/alta lógica
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = ActualizarSchema.parse(req.body);

    const [rows] = await pool.query(
      'SELECT id_usuario, rol, activo FROM usuario WHERE id_usuario = ?',
      [id]
    );
    const actual = (rows as { id_usuario: number; rol: string; activo: number }[])[0];
    if (!actual) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Salvaguarda: un admin no puede quitarse a sí mismo el acceso y dejar el
    // sistema sin quien gestione las cuentas.
    const esUnoMismo = req.user?.id_usuario === id;
    if (esUnoMismo && (data.activo === false || (data.rol && data.rol !== 'AdministradorSistema'))) {
      return res.status(409).json({ error: 'No podés quitarte a vos mismo el acceso de administrador' });
    }

    // Tampoco dejamos el sistema sin ningún administrador activo.
    const dejaDeSerAdmin =
      actual.rol === 'AdministradorSistema' &&
      ((data.rol && data.rol !== 'AdministradorSistema') || data.activo === false);
    if (dejaDeSerAdmin) {
      const [adminRows] = await pool.query(
        "SELECT COUNT(*) AS n FROM usuario WHERE rol = 'AdministradorSistema' AND activo = 1 AND id_usuario <> ?",
        [id]
      );
      if (Number((adminRows as { n: number }[])[0].n) === 0) {
        return res.status(409).json({ error: 'Debe quedar al menos un administrador activo' });
      }
    }

    const rol = data.rol ?? actual.rol;
    const activo = data.activo !== undefined ? (data.activo ? 1 : 0) : actual.activo;

    // Al cambiar rol o desactivar, se corta la sesión vigente para que el
    // cambio tenga efecto de inmediato (el token viejo deja de validar).
    await pool.query(
      'UPDATE usuario SET rol = ?, activo = ?, sesion_token = NULL WHERE id_usuario = ?',
      [rol, activo, id]
    );

    const [actualizado] = await pool.query(
      'SELECT id_usuario, nombre, email, rol, activo FROM usuario WHERE id_usuario = ?',
      [id]
    );
    const u = (actualizado as Record<string, unknown>[])[0];
    res.json({ ...u, id_usuario: Number(u.id_usuario), activo: Number(u.activo) === 1 });
  } catch (err) { next(err); }
});

export default router;
