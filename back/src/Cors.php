<?php

declare(strict_types=1);

/**
 * Headers CORS. El frontend (Vercel, o Vite en local) y la API viven en
 * origenes distintos, asi que el navegador exige estos headers.
 *
 * El origen de la peticion se valida contra una lista blanca ANTES de
 * reflejarlo: si no esta permitido no se envia Access-Control-Allow-Origin y
 * el navegador bloquea la respuesta. Reflejar cualquier Origin dejaria que
 * una pagina de otro dominio consuma la API desde el navegador del usuario.
 *
 * La lista se arma con:
 *   - los origenes por defecto de abajo (produccion y desarrollo local), y
 *   - lo que se configure en la variable de entorno CORS_ORIGIN, separando
 *     varios valores por coma.
 *
 * Se aceptan comodines al estilo shell, para los dominios de preview que
 * Vercel genera por rama (ej. https://*-acostaalex10.vercel.app).
 */
final class Cors
{
    /** @var string[] */
    private const ORIGENES_POR_DEFECTO = [
        'https://ingenieria-en-software-proyecto.vercel.app', // produccion
        'https://*-acostaalex10.vercel.app',                  // previews por rama
        'http://localhost:5173',                              // vite dev
        'http://localhost:4173',                              // vite preview
        'http://127.0.0.1:5173',
        'http://127.0.0.1:4173',
    ];

    public static function enviarHeaders(): void
    {
        $origen = $_SERVER['HTTP_ORIGIN'] ?? '';

        // Sin Origin no hay chequeo CORS del navegador (curl, Postman, el
        // health-check de Render): no hace falta el header.
        if ($origen !== '' && self::permitido($origen)) {
            header("Access-Control-Allow-Origin: {$origen}");
            // La respuesta depende del Origin: sin esto un cache intermedio
            // podria servirle a un origen la respuesta emitida para otro.
            header('Vary: Origin');
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        // IMPORTANTE: incluir Authorization, porque el frontend envia el JWT en
        // ese header. Sin esto el navegador bloquea las peticiones autenticadas.
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
    }

    /** Indica si el origen recibido figura en la lista blanca. */
    private static function permitido(string $origen): bool
    {
        foreach (self::listaBlanca() as $patron) {
            if ($patron === $origen) {
                return true;
            }
            // fnmatch resuelve los comodines (*) de los dominios de preview.
            if (str_contains($patron, '*') && fnmatch($patron, $origen)) {
                return true;
            }
        }
        return false;
    }

    /** @return string[] origenes por defecto + los configurados por entorno */
    private static function listaBlanca(): array
    {
        $extra = array_filter(array_map('trim', explode(',', (string) (getenv('CORS_ORIGIN') ?: ''))));
        return array_merge(self::ORIGENES_POR_DEFECTO, $extra);
    }
}
