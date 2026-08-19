<?php

declare(strict_types=1);

require_once __DIR__ . '/Env.php';

/**
 * Conexion a MariaDB/MySQL mediante PDO (singleton).
 * Lee los datos de conexion de variables de entorno (ver .env.example).
 * En local/on-premise no hace falta SSL; para una base en la nube que
 * lo exija, poner DB_SSL=true.
 */
final class Database
{
    private static ?PDO $pdo = null;

    public static function conexion(): PDO
    {
        if (self::$pdo !== null) {
            return self::$pdo;
        }

        $host = Env::get('DB_HOST', '127.0.0.1');
        $puerto = Env::get('DB_PORT', '3306');
        $nombre = Env::get('DB_NAME', 'sgso');
        $usuario = Env::get('DB_USER', 'root');
        $clave = Env::get('DB_PASSWORD', '');

        $dsn = "mysql:host={$host};port={$puerto};dbname={$nombre};charset=utf8mb4";

        $opciones = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        // Conexion cifrada para bases en la nube que la exigen (ej. Aiven).
        if (Env::get('DB_SSL', 'false') === 'true') {
            $opciones[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
        }

        self::$pdo = new PDO($dsn, $usuario, $clave, $opciones);
        return self::$pdo;
    }
}
