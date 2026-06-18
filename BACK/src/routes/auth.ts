import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';
import { verifyJWT, requireRole, JwtPayload } from '../middleware/auth';

const router = Router();

// Los 4 roles validos definidos en la tabla usuario (ENUM).
const ROLES = [
  'PersonalAdministrativo',
  'PersonalTecnico',
  'Gerente',
  'AdministradorSistema',
] as const;

// Forma de la fila que devuelve la base para un usuario.
interface UsuarioRow {
  id_usuario: number;
  nombre: string;
  email: string;
  contrasena: string; // hash bcrypt
  rol: string;
  activo: number; // TINYINT(1): 1 = activo, 0 = inactivo
}

// ------------------------------------------------------------------
// POST /api/auth/login
// Recibe email + contrasena, valida contra el hash y devuelve un JWT.
// ------------------------------------------------------------------
const LoginSchema = z.object({
  email: z.string().email('Email invalido'),
  contrasena: z.string().min(1, 'La contrasena es obligatoria'),
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, contrasena } = LoginSchema.parse(req.body);

    // 1) Buscar el usuario por email.
    const [rows] = await pool.query('SELECT * FROM usuario WHERE email = ?', [email]);
    const usuario = (rows as UsuarioRow[])[0];

    // 2) Mensaje generico a proposito: no revelamos si fallo el email o la
    //    contrasena, para no ayudar a un atacante a adivinar usuarios validos.
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    // 3) Si el usuario esta desactivado, no puede entrar.
    if (usuario.activo !== 1) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    // 4) Comparar la contrasena enviada contra el hash guardado.
    const coincide = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!coincide) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    // 5) Generar el token. NUNCA metemos la contrasena/hash en el payload.
    const payload: JwtPayload = {
      id_usuario: usuario.id_usuario,
      email: usuario.email,
      rol: usuario.rol,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET ?? '', {
      expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
    } as jwt.SignOptions);

    // 6) Devolver el token y datos publicos del usuario (sin el hash).
    res.json({
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------
// POST /api/auth/register
// Crea un usuario nuevo. Solo lo puede hacer un AdministradorSistema
// (CLAUDE.md: ese rol gestiona las cuentas). Esto ya ejercita el
// middleware verifyJWT + requireRole, base de RF19.
// ------------------------------------------------------------------
const RegisterSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Email invalido'),
  contrasena: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
  rol: z.enum(ROLES),
});

router.post(
  '/register',
  verifyJWT,
  requireRole('AdministradorSistema'),
  async (req, res, next) => {
    try {
      const data = RegisterSchema.parse(req.body);

      // Evitar emails duplicados (ademas la base tiene UNIQUE como red de seguridad).
      const [existentes] = await pool.query('SELECT id_usuario FROM usuario WHERE email = ?', [
        data.email,
      ]);
      if ((existentes as unknown[]).length > 0) {
        return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
      }

      // Hashear la contrasena antes de guardarla. El "10" es el costo (salt rounds):
      // mas alto = mas seguro pero mas lento. 10 es un valor estandar y seguro.
      const hash = await bcrypt.hash(data.contrasena, 10);

      const [result] = await pool.query(
        'INSERT INTO usuario (nombre, email, contrasena, rol) VALUES (?, ?, ?, ?)',
        [data.nombre, data.email, hash, data.rol]
      );
      const id = (result as { insertId: number }).insertId;

      res.status(201).json({
        id_usuario: id,
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------------------
// GET /api/auth/me
// Devuelve los datos del usuario logueado segun su token.
// Sirve para que el frontend valide si la sesion sigue viva.
// ------------------------------------------------------------------
router.get('/me', verifyJWT, (req, res) => {
  res.json({ usuario: req.user });
});

export default router;
