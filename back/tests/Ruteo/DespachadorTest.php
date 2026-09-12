<?php

declare(strict_types=1);

namespace Sgso\Tests\Ruteo;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Sgso\Ruteo\Despachador;
use Sgso\Ruteo\Resolucion;
use Sgso\Ruteo\Ruta;

/**
 * Resolucion de rutas (ADR-001 seccion 5.4).
 *
 * El despachador es puro: recibe metodo, camino y tabla, y devuelve que hacer.
 * No toca PDO, no imprime y no conoce HTTP, asi que todo esto se prueba sin
 * levantar nada.
 */
#[CoversClass(Despachador::class)]
#[CoversClass(Resolucion::class)]
final class DespachadorTest extends TestCase
{
    /** @return list<Ruta> */
    private static function tablaDePrueba(): array
    {
        return [
            new Ruta('GET', '/health', null, true, 'health'),
            new Ruta('GET', '/proyectos/asistencia', null, false, 'literal'),
            new Ruta('GET', '/proyectos/{id}', null, false, 'parametro'),
            new Ruta('PUT', '/proyectos/{id}', null, false, 'editar'),
            new Ruta('GET', '/proyectos/{id}/avances/{avance}', null, false, 'anidada'),
        ];
    }

    public function testMatcheaUnaRutaLiteral(): void
    {
        $resolucion = Despachador::resolver('GET', '/health', self::tablaDePrueba());

        self::assertSame(Resolucion::ENCONTRADA, $resolucion->estado);
        self::assertSame('health', $resolucion->ruta?->manejador);
        self::assertSame([], $resolucion->parametros);
    }

    public function testCapturaElParametro(): void
    {
        $resolucion = Despachador::resolver('GET', '/proyectos/42', self::tablaDePrueba());

        self::assertSame('parametro', $resolucion->ruta?->manejador);
        self::assertSame(['id' => '42'], $resolucion->parametros);
    }

    public function testCapturaVariosParametros(): void
    {
        $resolucion = Despachador::resolver('GET', '/proyectos/7/avances/9', self::tablaDePrueba());

        self::assertSame(['id' => '7', 'avance' => '9'], $resolucion->parametros);
    }

    /**
     * La trampa de la tabla: sin esta precedencia, /proyectos/asistencia caeria
     * en /proyectos/{id} y la API contestaria como si "asistencia" fuera el id
     * de una obra.
     */
    public function testElSegmentoLiteralLeGanaAlParametro(): void
    {
        $resolucion = Despachador::resolver('GET', '/proyectos/asistencia', self::tablaDePrueba());

        self::assertSame('literal', $resolucion->ruta?->manejador);
    }

    public function testUnCaminoDesconocidoNoSeEncuentra(): void
    {
        $resolucion = Despachador::resolver('GET', '/nada', self::tablaDePrueba());

        self::assertSame(Resolucion::NO_ENCONTRADA, $resolucion->estado);
        self::assertNull($resolucion->ruta);
        self::assertSame([], $resolucion->parametros);
    }

    public function testUnCaminoConocidoConOtroMetodoNoEsUn404(): void
    {
        // Distinguir 405 de 404 es lo que evita que un metodo equivocado
        // parezca un endpoint inexistente.
        $resolucion = Despachador::resolver('DELETE', '/proyectos/42', self::tablaDePrueba());

        self::assertSame(Resolucion::METODO_NO_PERMITIDO, $resolucion->estado);
        self::assertNull($resolucion->ruta);
    }

    /** @return iterable<string, array{string}> */
    public static function caminosQueNoMatchean(): iterable
    {
        yield 'sobran segmentos' => ['/proyectos/1/extra'];
        yield 'faltan segmentos' => ['/proyectos'];
        yield 'segmento vacio' => ['/proyectos/'];
    }

    #[DataProvider('caminosQueNoMatchean')]
    public function testNoMatcheaConOtraCantidadDeSegmentos(string $camino): void
    {
        $resolucion = Despachador::resolver('GET', $camino, self::tablaDePrueba());

        self::assertSame(Resolucion::NO_ENCONTRADA, $resolucion->estado);
    }

    public function testUnaTablaVaciaNoEncuentraNada(): void
    {
        self::assertSame(Resolucion::NO_ENCONTRADA, Despachador::resolver('GET', '/health', [])->estado);
    }

    public function testUnCaminoPublicoLoEsConCualquierMetodo(): void
    {
        // `DELETE /health` no existe, pero el camino es publico: contestar 405
        // ahi no filtra nada.
        self::assertTrue(Despachador::caminoEsPublico('/health', self::tablaDePrueba()));
    }

    public function testUnCaminoProtegidoNoEsPublico(): void
    {
        // Aca el 405 tiene que ir despues del token, para no revelar que
        // combinaciones de metodo y camino existen.
        self::assertFalse(Despachador::caminoEsPublico('/proyectos/42', self::tablaDePrueba()));
        self::assertFalse(Despachador::caminoEsPublico('/nada', self::tablaDePrueba()));
    }
}
