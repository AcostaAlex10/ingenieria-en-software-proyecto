<?php

declare(strict_types=1);

/**
 * Controlador de Planificacion. Cada proyecto tiene UNA planificacion
 * (avance esperado total). Portado del backend Node al stack PHP/MariaDB.
 */
final class PlanificacionController
{
    public function __construct(private PDO $db)
    {
    }

    /** GET /api/proyectos/{idProyecto}/planificacion */
    public function obtenerPorProyecto(string $idProyecto): void
    {
        $stmt = $this->db->prepare('SELECT * FROM planificacion WHERE id_proyecto = ?');
        $stmt->execute([$idProyecto]);
        $plan = $stmt->fetch();

        if ($plan === false) {
            $this->json(404, ['error' => 'Planificacion no encontrada para este proyecto']);
            return;
        }
        $this->json(200, $this->normalizar($plan));
    }

    /** POST /api/proyectos/{idProyecto}/planificacion */
    public function crear(string $idProyecto, array $datos): void
    {
        // El proyecto debe existir.
        $stmt = $this->db->prepare('SELECT id_proyecto FROM proyecto WHERE id_proyecto = ?');
        $stmt->execute([$idProyecto]);
        if ($stmt->fetch() === false) {
            $this->json(404, ['error' => 'Proyecto no encontrado']);
            return;
        }

        // Solo una planificacion por proyecto.
        $stmt = $this->db->prepare('SELECT id_planificacion FROM planificacion WHERE id_proyecto = ?');
        $stmt->execute([$idProyecto]);
        if ($stmt->fetch() !== false) {
            $this->json(409, ['error' => 'El proyecto ya tiene una planificacion. Use PUT para modificarla.']);
            return;
        }

        $errores = $this->validar($datos);
        if (!empty($errores)) {
            $this->json(422, ['errors' => $errores]);
            return;
        }

        $stmt = $this->db->prepare(
            'INSERT INTO planificacion (avance_esperado_total, fecha_carga, id_proyecto) VALUES (?, ?, ?)'
        );
        $stmt->execute([(float) $datos['avance_esperado_total'], $datos['fecha_carga'], $idProyecto]);

        $this->json(201, [
            'id_planificacion' => (int) $this->db->lastInsertId(),
            'avance_esperado_total' => (float) $datos['avance_esperado_total'],
            'fecha_carga' => $datos['fecha_carga'],
            'id_proyecto' => (int) $idProyecto,
        ]);
    }

    /** PUT /api/planificacion/{id} */
    public function actualizar(string $id, array $datos): void
    {
        $stmt = $this->db->prepare('SELECT * FROM planificacion WHERE id_planificacion = ?');
        $stmt->execute([$id]);
        $actual = $stmt->fetch();
        if ($actual === false) {
            $this->json(404, ['error' => 'Planificacion no encontrada']);
            return;
        }

        $errores = $this->validar($datos, true);
        if (!empty($errores)) {
            $this->json(422, ['errors' => $errores]);
            return;
        }

        $stmt = $this->db->prepare(
            'UPDATE planificacion SET avance_esperado_total = ?, fecha_carga = ? WHERE id_planificacion = ?'
        );
        $stmt->execute([
            isset($datos['avance_esperado_total']) ? (float) $datos['avance_esperado_total'] : $actual['avance_esperado_total'],
            $datos['fecha_carga'] ?? $actual['fecha_carga'],
            $id,
        ]);
        $this->json(200, ['mensaje' => 'Planificacion actualizada']);
    }

    /** DELETE /api/planificacion/{id} */
    public function eliminar(string $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM planificacion WHERE id_planificacion = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) {
            $this->json(404, ['error' => 'Planificacion no encontrada']);
            return;
        }
        $this->json(200, ['mensaje' => 'Planificacion eliminada']);
    }

    /** @param array<string,mixed> $datos @return array<string,string> */
    private function validar(array $datos, bool $parcial = false): array
    {
        $errores = [];
        $tiene = isset($datos['avance_esperado_total']);
        if (!$parcial && !$tiene) {
            $errores['avance_esperado_total'] = 'Obligatorio';
        } elseif ($tiene) {
            $v = $datos['avance_esperado_total'];
            if (!is_numeric($v) || $v < 0 || $v > 100) {
                $errores['avance_esperado_total'] = 'Debe ser un numero entre 0 y 100';
            }
        }
        $tieneFecha = isset($datos['fecha_carga']);
        if (!$parcial && !$tieneFecha) {
            $errores['fecha_carga'] = 'Obligatorio';
        } elseif ($tieneFecha && !preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $datos['fecha_carga'])) {
            $errores['fecha_carga'] = 'Formato esperado: YYYY-MM-DD';
        }
        return $errores;
    }

    /** @param array<string,mixed> $fila @return array<string,mixed> */
    private function normalizar(array $fila): array
    {
        $fila['id_planificacion'] = (int) $fila['id_planificacion'];
        $fila['id_proyecto'] = (int) $fila['id_proyecto'];
        $fila['avance_esperado_total'] = (float) $fila['avance_esperado_total'];
        return $fila;
    }

    private function json(int $codigo, mixed $cuerpo): void
    {
        http_response_code($codigo);
        echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
    }
}
