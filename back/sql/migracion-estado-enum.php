<?php

declare(strict_types=1);

/**
 * Convierte proyecto.estado de VARCHAR(30) a ENUM con los siete estados del
 * ciclo de vida del TP3.
 *
 * Hace falta un script aparte porque migrar.php solo ejecuta schema.sql, y
 * todas sus tablas usan CREATE TABLE IF NOT EXISTS: sobre una base que ya
 * existe, cambiar el tipo de una columna en schema.sql no tiene ningun efecto.
 * Sin esto, el ENUM solo aplicaria a instalaciones nuevas.
 *
 * Se puede correr mas de una vez: si la columna ya es un ENUM, no toca nada.
 *
 * Uso:
 *   DB_HOST=... DB_PORT=... DB_NAME=... DB_USER=... DB_PASSWORD=... DB_SSL=true \
 *     php back/sql/migracion-estado-enum.php
 */

/** Los siete estados, en la convencion snake_case de la base. */
const ESTADOS = [
    'creada',        // TP3: Creado
    'planificacion', // TP3: Planificado
    'en_ejecucion',  // TP3: EnEjecucion
    'pausada',       // TP3: Pausado
    'en_revision',   // TP3: EnRevision
    'finalizada',    // TP3: Finalizado
    'cancelada',     // TP3: Cancelado
];

$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: '3306';
$db   = getenv('DB_NAME') ?: 'sgso';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASSWORD') ?: '';

$dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
$opciones = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION];
if (getenv('DB_SSL') === 'true') {
    $opciones[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
}

$pdo = new PDO($dsn, $user, $pass, $opciones);

// 1. Si ya es el ENUM, no hay nada que hacer.
$stmt = $pdo->prepare(
    'SELECT COLUMN_TYPE FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?'
);
$stmt->execute(['proyecto', 'estado']);
$tipo = $stmt->fetchColumn();

if ($tipo === false) {
    fwrite(STDERR, "No existe proyecto.estado. Corre primero: php back/sql/migrar.php\n");
    exit(1);
}
if (str_starts_with(strtolower((string) $tipo), 'enum(')) {
    echo "proyecto.estado ya es un ENUM.\n";
    echo "  {$tipo}\n";
    exit(0);
}

// 2. Ninguna fila puede tener un estado fuera de la lista. MySQL convertiria
//    esos valores en cadena vacia sin avisar, y la obra quedaria sin estado.
$actuales = $pdo->query('SELECT DISTINCT estado FROM proyecto')->fetchAll(PDO::FETCH_COLUMN);
$fuera = array_values(array_diff($actuales, ESTADOS));

if ($fuera !== []) {
    fwrite(STDERR, "Hay obras con un estado que no entra en el ENUM:\n");
    foreach ($fuera as $valor) {
        fwrite(STDERR, "  - '{$valor}'\n");
    }
    fwrite(STDERR, "Corregilos antes de migrar; si no, esas obras se quedarian sin estado.\n");
    exit(1);
}

// 3. Alterar.
$lista = "'" . implode("','", ESTADOS) . "'";
$pdo->exec("ALTER TABLE proyecto MODIFY estado ENUM({$lista}) NOT NULL DEFAULT 'planificacion'");

echo "Listo. proyecto.estado ahora acepta solo: " . implode(', ', ESTADOS) . "\n";
echo "Estados en uso: " . ($actuales === [] ? 'ninguno (tabla vacia)' : implode(', ', $actuales)) . "\n";
