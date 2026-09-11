<?php

declare(strict_types=1);

namespace Sgso\Ruteo;

/**
 * Resuelve un pedido contra la tabla de rutas (ADR-001 seccion 5.4).
 *
 * Es puro: no toca PDO, no imprime, no lee $_SERVER y no conoce HTTP. Solo
 * dice que ruta corresponde, o si el camino no existe o el metodo no aplica.
 */
final class Despachador
{
    /** @param list<Ruta> $rutas */
    public static function resolver(string $metodo, string $ruta, array $rutas): Resolucion
    {
        $coincidioCamino = false;

        foreach ($rutas as $rutaDeclarada) {
            $parametros = self::parametros($ruta, $rutaDeclarada->patron);
            if ($parametros === null) {
                continue;
            }

            $coincidioCamino = true;
            if ($rutaDeclarada->metodo === $metodo) {
                return Resolucion::encontrada($rutaDeclarada, $parametros);
            }
        }

        return $coincidioCamino ? Resolucion::metodoNoPermitido() : Resolucion::noEncontrada();
    }

    /**
     * Si el camino corresponde a un recurso publico, sin importar el metodo.
     *
     * Sirve para responder 405 en el orden correcto: en un camino protegido,
     * primero se exige el token y recien despues se dice que el metodo no
     * aplica. Si no, un anonimo podria averiguar que combinaciones de metodo y
     * camino existen simplemente probandolas, que es justo lo que el ruteo
     * anterior no permitia.
     *
     * @param list<Ruta> $rutas
     */
    public static function caminoEsPublico(string $ruta, array $rutas): bool
    {
        foreach ($rutas as $rutaDeclarada) {
            if (self::parametros($ruta, $rutaDeclarada->patron) !== null && $rutaDeclarada->publica) {
                return true;
            }
        }

        return false;
    }

    /** @return ?array<string, string> */
    private static function parametros(string $ruta, string $patron): ?array
    {
        $segmentosRuta = self::segmentos($ruta);
        $segmentosPatron = self::segmentos($patron);
        if (count($segmentosRuta) !== count($segmentosPatron)) {
            return null;
        }

        $parametros = [];
        foreach ($segmentosPatron as $indice => $segmentoPatron) {
            $segmentoRuta = $segmentosRuta[$indice];
            if (preg_match('/^\\{([A-Za-z][A-Za-z0-9_]*)\\}$/', $segmentoPatron, $coincidencia) === 1) {
                if ($segmentoRuta === '') {
                    return null;
                }
                $parametros[$coincidencia[1]] = $segmentoRuta;
            } elseif ($segmentoPatron !== $segmentoRuta) {
                return null;
            }
        }

        return $parametros;
    }

    /** @return list<string> */
    private static function segmentos(string $ruta): array
    {
        return $ruta === '/' ? [] : explode('/', ltrim($ruta, '/'));
    }
}
