import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';

// Datos que viajan DENTRO del token (el "payload"). No incluimos nunca la
// contrasena ni el hash: solo lo minimo para identificar al usuario y su rol.
export interface JwtPayload {
  id_usuario: number;
  email: string;
  rol: string;
  /** Identificador de la sesión activa: se compara contra usuario.sesion_token. */
  sid?: string;
}

// Extendemos el tipo Request de Express para poder guardar el usuario
// autenticado en req.user de forma tipada.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware que protege rutas: exige un JWT valido en el header
 *   Authorization: Bearer <token>
 * Si el token es valido, deja los datos del usuario en req.user y continua.
 * Si falta o es invalido, corta con 401.
 */
export async function verifyJWT(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Falta el token de autenticacion' });
  }

  const token = header.slice('Bearer '.length);

  let payload: JwtPayload;
  try {
    const secret = process.env.JWT_SECRET ?? '';
    payload = jwt.verify(token, secret) as JwtPayload;
  } catch {
    return res.status(401).json({ error: 'Token invalido o expirado' });
  }

  // Sesion unica: el sid del token tiene que seguir siendo el vigente en la base.
  // Si el usuario volvio a entrar en otro lado (o se restablecio la contrasena),
  // el sid cambio y este token ya no vale.
  try {
    const [rows] = await pool.query(
      'SELECT sesion_token, activo FROM usuario WHERE id_usuario = ?',
      [payload.id_usuario]
    );
    const fila = (rows as { sesion_token: string | null; activo: number }[])[0];
    if (!fila || fila.activo !== 1) {
      return res.status(401).json({ error: 'Usuario inactivo o inexistente' });
    }
    if (payload.sid && fila.sesion_token && payload.sid !== fila.sesion_token) {
      return res.status(401).json({ error: 'Sesion cerrada: iniciaste sesion en otro dispositivo' });
    }
  } catch {
    return res.status(500).json({ error: 'No se pudo validar la sesion' });
  }

  req.user = payload;
  next();
}

/**
 * Middleware factory para autorizacion por rol (base de RF19).
 * Uso:  router.post('/algo', verifyJWT, requireRole('AdministradorSistema'), handler)
 * Debe ir SIEMPRE despues de verifyJWT (necesita req.user).
 */
export function requireRole(...rolesPermitidos: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tenes permisos para esta accion' });
    }
    next();
  };
}
