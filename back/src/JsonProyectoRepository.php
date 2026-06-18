<?php

declare(strict_types=1);

require_once __DIR__ . '/ProyectoRepositoryInterface.php';

/**
 * Implementación temporal de ProyectoRepositoryInterface usando un
 * archivo JSON como almacenamiento, para poder desarrollar y probar
 * el CRUD completo (RF01 / CU1, CU2, CU3) antes de tener MariaDB.
 *
 * Usa flock() para evitar corromper el archivo si llegaran a pegarle
 * dos requests al mismo tiempo (poco probable en desarrollo, pero es
 * buena práctica).
 */
final class JsonProyectoRepository implements ProyectoRepositoryInterface
{
    public function __construct(private string $rutaArchivo)
    {
        if (!file_exists($this->rutaArchivo)) {
            file_put_contents($this->rutaArchivo, json_encode([]));
        }
    }

    public function listar(?string $busqueda = null): array
    {
        $proyectos = $this->leerTodos();

        if ($busqueda === null || trim($busqueda) === '') {
            return array_values($proyectos);
        }

        $busqueda = mb_strtolower($busqueda);

        $filtrados = array_filter($proyectos, function (array $proyecto) use ($busqueda) {
            return str_contains(mb_strtolower($proyecto['nombre']), $busqueda)
                || str_contains(mb_strtolower($proyecto['ubicacion']), $busqueda);
        });

        return array_values($filtrados);
    }

    public function buscarPorId(string $id): ?array
    {
        $proyectos = $this->leerTodos();
        return $proyectos[$id] ?? null;
    }

    public function crear(array $datos): array
    {
        $proyectos = $this->leerTodos();

        $id = (string) $this->obtenerSiguienteId($proyectos);

        $proyecto = [
            'id' => $id,
            'nombre' => $datos['nombre'],
            'tipo' => $datos['tipo'],
            'ubicacion' => $datos['ubicacion'],
            'encargado' => $datos['encargado'],
            'fechaInicio' => $datos['fechaInicio'],
            // Nace en "planificacion" en este prototipo. Cuando se
            // alinee con el diagrama de estados del TP3, el estado
            // inicial real debería ser "Creado" hasta que se cargue
            // la planificación inicial (RF03).
            'estado' => $datos['estado'] ?? 'planificacion',
            'avance' => (float) ($datos['avance'] ?? 0),
            'presupuesto' => (float) $datos['presupuesto'],
        ];

        $proyectos[$id] = $proyecto;
        $this->guardarTodos($proyectos);

        return $proyecto;
    }

    public function actualizar(string $id, array $datos): ?array
    {
        $proyectos = $this->leerTodos();

        if (!isset($proyectos[$id])) {
            return null;
        }

        $actual = $proyectos[$id];

        $proyectos[$id] = [
            'id' => $id,
            'nombre' => $datos['nombre'] ?? $actual['nombre'],
            'tipo' => $datos['tipo'] ?? $actual['tipo'],
            'ubicacion' => $datos['ubicacion'] ?? $actual['ubicacion'],
            'encargado' => $datos['encargado'] ?? $actual['encargado'],
            'fechaInicio' => $datos['fechaInicio'] ?? $actual['fechaInicio'],
            'estado' => $datos['estado'] ?? $actual['estado'],
            'avance' => isset($datos['avance']) ? (float) $datos['avance'] : $actual['avance'],
            'presupuesto' => isset($datos['presupuesto']) ? (float) $datos['presupuesto'] : $actual['presupuesto'],
        ];

        $this->guardarTodos($proyectos);

        return $proyectos[$id];
    }

    public function eliminar(string $id): bool
    {
        $proyectos = $this->leerTodos();

        if (!isset($proyectos[$id])) {
            return false;
        }

        unset($proyectos[$id]);
        $this->guardarTodos($proyectos);

        return true;
    }

    public function existeDuplicado(string $nombre, string $ubicacion, ?string $idExcluido = null): bool
    {
        foreach ($this->leerTodos() as $proyecto) {
            if ($idExcluido !== null && $proyecto['id'] === $idExcluido) {
                continue;
            }

            $mismoNombre = mb_strtolower($proyecto['nombre']) === mb_strtolower($nombre);
            $mismaUbicacion = mb_strtolower($proyecto['ubicacion']) === mb_strtolower($ubicacion);

            if ($mismoNombre && $mismaUbicacion) {
                return true;
            }
        }

        return false;
    }

    /** @return array<string, array<string, mixed>> indexado por id */
    private function leerTodos(): array
    {
        $manejador = fopen($this->rutaArchivo, 'r');
        flock($manejador, LOCK_SH);
        $contenido = stream_get_contents($manejador);
        flock($manejador, LOCK_UN);
        fclose($manejador);

        $lista = json_decode($contenido, true) ?: [];

        $indexado = [];
        foreach ($lista as $proyecto) {
            $indexado[(string) $proyecto['id']] = $proyecto;
        }

        return $indexado;
    }

    /** @param array<string, array<string, mixed>> $proyectos */
    private function guardarTodos(array $proyectos): void
    {
        $manejador = fopen($this->rutaArchivo, 'c+');
        flock($manejador, LOCK_EX);
        ftruncate($manejador, 0);
        fwrite($manejador, json_encode(array_values($proyectos), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        fflush($manejador);
        flock($manejador, LOCK_UN);
        fclose($manejador);
    }

    /** @param array<string, array<string, mixed>> $proyectos */
    private function obtenerSiguienteId(array $proyectos): int
    {
        if (empty($proyectos)) {
            return 1;
        }

        return max(array_map('intval', array_keys($proyectos))) + 1;
    }
}
