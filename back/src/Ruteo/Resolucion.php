<?php

declare(strict_types=1);

namespace Sgso\Ruteo;

final readonly class Resolucion
{
    public const ENCONTRADA = 'encontrada';
    public const NO_ENCONTRADA = 'no_encontrada';
    public const METODO_NO_PERMITIDO = 'metodo_no_permitido';

    /** @param array<string, string> $parametros */
    private function __construct(
        public string $estado,
        public ?Ruta $ruta,
        public array $parametros,
    ) {
    }

    /** @param array<string, string> $parametros */
    public static function encontrada(Ruta $ruta, array $parametros): self
    {
        return new self(self::ENCONTRADA, $ruta, $parametros);
    }

    public static function noEncontrada(): self
    {
        return new self(self::NO_ENCONTRADA, null, []);
    }

    public static function metodoNoPermitido(): self
    {
        return new self(self::METODO_NO_PERMITIDO, null, []);
    }
}
