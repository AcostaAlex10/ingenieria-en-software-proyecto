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
        // Reflejamos el origen de la peticion (si viene) para que funcione desde
        // cualquier dominio del frontend (ej. los varios subdominios de Vercel),
        // y si no hay Origin usamos el configurado por CORS_ORIGIN.
        $origen = $_SERVER['HTTP_ORIGIN'] ?? (getenv('CORS_ORIGIN') ?: 'http://localhost:5173');

        header("Access-Control-Allow-Origin: {$origen}");
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        // IMPORTANTE: incluir Authorization, porque el frontend envia el JWT en
        // ese header. Sin esto el navegador bloquea las peticiones autenticadas.
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
    }
}
