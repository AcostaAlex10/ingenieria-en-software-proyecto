<?php

declare(strict_types=1);

/**
 * Headers CORS. El frontend corre en http://localhost:5173 (Vite) y
 * el backend en http://localhost:8000 (servidor embebido de PHP):
 * son orígenes distintos, así que el navegador exige estos headers.
 *
 * El origen permitido se puede sobreescribir con la variable de
 * entorno CORS_ORIGIN (útil cuando esto se despliegue en otro lado).
 */
final class Cors
{
    public static function enviarHeaders(): void
    {
        $origenPermitido = getenv('CORS_ORIGIN') ?: 'http://localhost:5173';

        header("Access-Control-Allow-Origin: {$origenPermitido}");
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
    }
}
