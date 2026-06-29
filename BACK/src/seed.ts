/**
 * Seed minimo: crea (o actualiza) el usuario administrador de prueba con su
 * contrasena HASHEADA con bcrypt. Nunca se guarda texto plano.
 *
 * Ejecutar con:  npm run seed   (desde la carpeta BACK)
 *
 * Credenciales de prueba que quedan disponibles:
 *   email: admin@sgso.com
 *   pass:  admin123
 */
import bcrypt from 'bcryptjs';
import { pool } from './config/db';

async function seed() {
  const email = 'admin@sgso.com';
  const passwordPlano = 'admin123';
  const nombre = 'Admin Sistema';
  const rol = 'AdministradorSistema';

  // Hasheamos la contrasena (10 salt rounds, valor estandar).
  const hash = await bcrypt.hash(passwordPlano, 10);

  // INSERT ... ON DUPLICATE KEY UPDATE: si el admin no existe lo crea; si ya
  // existe (por email UNIQUE) le actualiza el hash. Asi tambien "arregla" el
  // admin en texto plano que dejaba la migracion 001.
  await pool.query(
    `INSERT INTO usuario (nombre, email, contrasena, rol, activo)
     VALUES (?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE contrasena = VALUES(contrasena), activo = 1`,
    [nombre, email, hash, rol]
  );

  console.log(`Seed OK -> admin listo:  ${email} / ${passwordPlano}`);
  await pool.end();
}

seed().catch((err) => {
  console.error('Error en el seed:', err);
  process.exit(1);
});
