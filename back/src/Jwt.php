<?php

declare(strict_types=1);

/**
 * Implementacion minima de JSON Web Token (JWT) con algoritmo HS256.
 * Hecha a mano para no depender de Composer (igual que el resto del
 * backend). Un JWT son 3 partes separadas por puntos: header.payload.firma,
 * cada una en base64url. La firma es un HMAC-SHA256 de "header.payload"
 * con la clave secreta: si alguien altera el token, la firma no coincide.
 */
final class Jwt
{
    /** @param array<string, mixed> $payload */
    public static function generar(array $payload, string $secreto, int $segundosValidez): string
    {
        $header = ['alg' => 'HS256', 'typ' => 'JWT'];
        $payload['iat'] = time();
        $payload['exp'] = time() + $segundosValidez;

        $h = self::base64UrlEncode(json_encode($header, JSON_THROW_ON_ERROR));
        $p = self::base64UrlEncode(json_encode($payload, JSON_THROW_ON_ERROR));
        $firma = self::base64UrlEncode(hash_hmac('sha256', "{$h}.{$p}", $secreto, true));

        return "{$h}.{$p}.{$firma}";
    }

    /**
     * Devuelve el payload si el token es valido y no expiro; null si no.
     * @return array<string, mixed>|null
     */
    public static function verificar(string $token, string $secreto): ?array
    {
        $partes = explode('.', $token);
        if (count($partes) !== 3) {
            return null;
        }

        [$h, $p, $firma] = $partes;

        $firmaEsperada = self::base64UrlEncode(hash_hmac('sha256', "{$h}.{$p}", $secreto, true));
        // hash_equals compara en tiempo constante (evita ataques de temporizado).
        if (!hash_equals($firmaEsperada, $firma)) {
            return null;
        }

        $payload = json_decode(self::base64UrlDecode($p), true);
        if (!is_array($payload)) {
            return null;
        }

        if (isset($payload['exp']) && time() >= (int) $payload['exp']) {
            return null;
        }

        return $payload;
    }

    private static function base64UrlEncode(string $datos): string
    {
        return rtrim(strtr(base64_encode($datos), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $datos): string
    {
        return base64_decode(strtr($datos, '-_', '+/')) ?: '';
    }
}
