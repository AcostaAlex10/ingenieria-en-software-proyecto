import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Datos que viajan DENTRO del token (el "payload"). No incluimos nunca la
// contrasena ni el hash: solo lo minimo para identificar al usuario y su rol.
export interface JwtPayload {
  id_usuario: number;
  email: string;
  rol: string;
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
export function verifyJWT(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Falta el token de autenticacion' });
  }

  const token = header.slice('Bearer '.length);

  try {
    const secret = process.env.JWT_SECRET ?? '';
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalido o expirado' });
  }
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
