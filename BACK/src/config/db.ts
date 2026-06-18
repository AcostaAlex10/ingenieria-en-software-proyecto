import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Las bases de datos gestionadas en la nube suelen exigir conexion cifrada (SSL/TLS).
// Si DB_SSL=true, habilitamos SSL. (rejectUnauthorized:false acepta el certificado del
// proveedor sin tener que cargar su CA; es comodo para un proyecto academico.)
const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'sgso',
  ssl,
  waitForConnections: true,
  connectionLimit: 10,
});
