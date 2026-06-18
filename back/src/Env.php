<?php

declare(strict_types=1);

/**
 * Cargador minimo de variables de entorno desde un archivo .env
 * (KEY=VALUE por linea). PHP no lee .env solo, asi que esto suple a
 * dotenv sin necesidad de Composer. No pisa variables ya definidas en
 * el entorno real del servidor (utiles en produccion / on-premise).
 */
final class Env
{
    public static function cargar(string $rutaArchivo): void
    {
        if (!is_file($rutaArchivo)) {
            return;
        }

        foreach (file($rutaArchivo, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linea) {
            $linea = trim($linea);
            if ($linea === '' || str_starts_with($linea, '#')) {
                continue;
            }

            [$clave, $valor] = array_pad(explode('=', $linea, 2), 2, '');
            $clave = trim($clave);
            $valor = trim($valor);

            if ($clave !== '' && getenv($clave) === false) {
                putenv("{$clave}={$valor}");
                $_ENV[$clave] = $valor;
            }
        }
    }

    public static function get(string $clave, ?string $porDefecto = null): ?string
    {
        $valor = getenv($clave);
        return $valor === false ? $porDefecto : $valor;
    }
}
