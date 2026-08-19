<?php

declare(strict_types=1);

require_once __DIR__ . '/Jwt.php';

/**
 * Lee el token del header "Authorization: Bearer <token>" y lo valida.
 * Devuelve el payload del usuario (id_usuario, email, rol) o null si no
 * hay token valido. Es el equivalente al middleware verifyJWT.
 */
final class AuthMiddleware
{
    /** @return array<string, mixed>|null */
    public static function usuarioAutenticado(string $secreto): ?array
    {
        $headers = self::leerHeaders();
        $autorizacion = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!str_starts_with($autorizacion, 'Bearer ')) {
            return null;
        }

        $token = substr($autorizacion, 7);
        return Jwt::verificar($token, $secreto);
    }

    /** @return array<string, string> */
    private static function leerHeaders(): array
    {
        if (function_exists('getallheaders')) {
            return getallheaders() ?: [];
        }

        // Fallback por si getallheaders() no esta disponible.
        $headers = [];
        foreach ($_SERVER as $clave => $valor) {
            if (str_starts_with($clave, 'HTTP_')) {
                $nombre = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($clave, 5)))));
                $headers[$nombre] = $valor;
            }
        }
        return $headers;
    }
}
