<?php

declare(strict_types=1);

/**
 * Ejecuta back/sql/schema.sql contra la base configurada por variables de
 * entorno (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL).
 *
 * Es idempotente: todas las tablas usan CREATE TABLE IF NOT EXISTS, por lo
 * que correrlo varias veces no rompe nada (solo crea lo que falte).
 *
 * Uso (PowerShell):
 *   $env:DB_HOST="..."; $env:DB_PORT="..."; ...; php back/sql/migrar.php
 */

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

$sql = file_get_contents(__DIR__ . '/schema.sql');
// Quitamos los comentarios de linea (-- ...) para poder separar por ';'.
$sql = preg_replace('/^\s*--.*$/m', '', (string) $sql);

$sentencias = array_filter(array_map('trim', explode(';', (string) $sql)));
foreach ($sentencias as $sentencia) {
    if ($sentencia === '') {
        continue;
    }
    $pdo->exec($sentencia);
    $resumen = substr(preg_replace('/\s+/', ' ', $sentencia) ?? '', 0, 64);
    echo "OK  {$resumen}...\n";
}

echo "Migracion completa.\n";
