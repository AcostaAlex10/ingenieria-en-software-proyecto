import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from './auth';

/**
 * Auth "blando": si viene un token valido en Authorization, deja el usuario en
 * req.user; si no viene o es invalido, NO corta la peticion (sigue como anonimo).
 * Lo usamos para que rutas como /analisis (ocultar costos por rol) o crear
 * reportes (autor) conozcan al usuario sin exigir login en todo el backend.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const secret = process.env.JWT_SECRET ?? '';
      req.user = jwt.verify(header.slice('Bearer '.length), secret) as JwtPayload;
    } catch {
      // token vencido/invalido: seguimos como anonimo
    }
  }
  next();
}
