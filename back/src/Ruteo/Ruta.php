<?php

declare(strict_types=1);

namespace Sgso\Ruteo;

final readonly class Ruta
{
    /** @param ?list<string> $roles */
    public function __construct(
        public string $metodo,
        public string $patron,
        public ?array $roles,
        public bool $publica,
        public string $manejador,
    ) {
    }
}
