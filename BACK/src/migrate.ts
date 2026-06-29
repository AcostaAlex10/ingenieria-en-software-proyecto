/**
 * Ejecuta las migraciones SQL de la carpeta migrations/ en orden alfabetico.
 * Lleva un registro en la tabla `_migraciones` para no volver a aplicar una ya
 * ejecutada (idempotente: se puede correr varias veces sin error).
 *
 * Uso:  npm run migrate     (carpeta BACK)
 */
import fs from 'fs';
import path from 'path';
import { pool } from './config/db';

// Funciona tanto con ts-node (src/) como compilado (dist/): ../migrations
const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');

function dividirSentencias(sql: string): string[] {
  return sql
    .split(/\r?\n/)
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function migrate() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS _migraciones (
       nombre VARCHAR(255) PRIMARY KEY,
       aplicada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`
  );

  const archivos = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const [filas] = await pool.query('SELECT nombre FROM _migraciones');
  const yaAplicadas = new Set((filas as { nombre: string }[]).map((r) => r.nombre));

  for (const archivo of archivos) {
    if (yaAplicadas.has(archivo)) {
      console.log(`= ${archivo} (ya aplicada, se saltea)`);
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, archivo), 'utf8');
    for (const sentencia of dividirSentencias(sql)) {
      await pool.query(sentencia);
    }
    await pool.query('INSERT INTO _migraciones (nombre) VALUES (?)', [archivo]);
    console.log(`+ ${archivo} (aplicada)`);
  }

  console.log('Migraciones al dia.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Error en las migraciones:', err.sqlMessage ?? err.message);
  process.exit(1);
});
