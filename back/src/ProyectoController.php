<?php

declare(strict_types=1);

require_once __DIR__ . '/ProyectoRepositoryInterface.php';

/**
 * Controlador de Proyectos. No sabe nada de JSON-en-archivo ni de
 * MariaDB: sólo conoce la interfaz ProyectoRepositoryInterface.
 * Implementa las validaciones del flujo de CU1 (Registrar Proyecto)
 * y CU2/CU3 (Modificar/Eliminar) tal como quedaron en el TP3.
 */
final class ProyectoController
{
    private const CAMPOS_OBLIGATORIOS = [
        'nombre',
        'tipo',
        'ubicacion',
        'encargado',
        'fechaInicio',
        'presupuesto',
    ];

    public function __construct(private ProyectoRepositoryInterface $repositorio)
    {
    }

    public function listar(?string $busqueda): void
    {
        $this->responderJson(200, $this->repositorio->listar($busqueda));
    }

    public function mostrar(string $id): void
    {
        $proyecto = $this->repositorio->buscarPorId($id);

        if ($proyecto === null) {
            $this->responderJson(404, ['error' => 'Proyecto no encontrado']);
            return;
        }

        $this->responderJson(200, $proyecto);
    }

    /** @param array<string, mixed> $datos */
    public function registrar(array $datos): void
    {
        $errores = $this->validar($datos);

        if (!empty($errores)) {
            $this->responderJson(422, ['errors' => $errores]);
            return;
        }

        if ($this->repositorio->existeDuplicado($datos['nombre'], $datos['ubicacion'])) {
            $this->responderJson(409, ['error' => 'Obra ya existente']);
            return;
        }

        $proyecto = $this->repositorio->crear($datos);
        $this->responderJson(201, $proyecto);
    }

    /** @param array<string, mixed> $datos */
    public function modificar(string $id, array $datos): void
    {
        if ($this->repositorio->buscarPorId($id) === null) {
            $this->responderJson(404, ['error' => 'Proyecto no encontrado']);
            return;
        }

        $errores = $this->validar($datos);

        if (!empty($errores)) {
            $this->responderJson(422, ['errors' => $errores]);
            return;
        }

        if ($this->repositorio->existeDuplicado($datos['nombre'], $datos['ubicacion'], $id)) {
            $this->responderJson(409, ['error' => 'Obra ya existente']);
            return;
        }

        $proyecto = $this->repositorio->actualizar($id, $datos);
        $this->responderJson(200, $proyecto);
    }

    public function eliminar(string $id): void
    {
        if (!$this->repositorio->eliminar($id)) {
            $this->responderJson(404, ['error' => 'Proyecto no encontrado']);
            return;
        }

        $this->responderJson(200, ['mensaje' => 'Proyecto eliminado correctamente']);
    }

    /**
     * @param array<string, mixed> $datos
     * @return array<string, string> errores por campo, vacío si todo OK
     */
    private function validar(array $datos): array
    {
        $errores = [];

        foreach (self::CAMPOS_OBLIGATORIOS as $campo) {
            if (!isset($datos[$campo]) || trim((string) $datos[$campo]) === '') {
                $errores[$campo] = 'Obligatorio';
            }
        }

        if (isset($datos['presupuesto']) && trim((string) $datos['presupuesto']) !== '' && !is_numeric($datos['presupuesto'])) {
            $errores['presupuesto'] = 'Debe ser un número';
        }

        return $errores;
    }

    private function responderJson(int $codigoHttp, mixed $cuerpo): void
    {
        http_response_code($codigoHttp);
        echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
    }
}
