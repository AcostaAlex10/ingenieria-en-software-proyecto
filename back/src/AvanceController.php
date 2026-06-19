<?php

declare(strict_types=1);

/**
 * Controlador de Avances fisicos. Cada avance se carga contra una
 * planificacion. Incluye un resumen que compara avance esperado vs real.
 * Portado del backend Node al stack PHP/MariaDB.
 */
final class AvanceController
{
    public function __construct(private PDO $db)
    {
    }

    /** GET /api/planificacion/{planId}/avances */
    public function listarPorPlan(string $planId): void
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM avance_fisico WHERE id_planificacion = ? ORDER BY fecha DESC'
        );
        $stmt->execute([$planId]);
        $this->json(200, array_map([self::class, 'normalizar'], $stmt->fetchAll()));
    }

    /** GET /api/planificacion/{planId}/avances/resumen */
    public function resumen(string $planId): void
    {
        $stmt = $this->db->prepare('SELECT avance_esperado_total FROM planificacion WHERE id_planificacion = ?');
        $stmt->execute([$planId]);
        $plan = $stmt->fetch();
        if ($plan === false) {
            $this->json(404, ['error' => 'Planificacion no encontrada']);
            return;
        }

        $stmt = $this->db->prepare(
            'SELECT COUNT(*) AS total_registros, MAX(porcentaje_avance) AS avance_real, MAX(fecha) AS ultimo_registro
             FROM avance_fisico WHERE id_planificacion = ?'
        );
        $stmt->execute([$planId]);
        $stats = $stmt->fetch();

        $esperado = (float) $plan['avance_esperado_total'];
        $real = (float) ($stats['avance_real'] ?? 0);

        $this->json(200, [
            'avance_esperado' => $esperado,
            'avance_real' => $real,
            'desvio_pp' => round($real - $esperado, 2),
            'total_registros' => (int) $stats['total_registros'],
            'ultimo_registro' => $stats['ultimo_registro'],
        ]);
    }

    /** POST /api/planificacion/{planId}/avances */
    public function crear(string $planId, array $datos): void
    {
        $stmt = $this->db->prepare('SELECT id_planificacion FROM planificacion WHERE id_planificacion = ?');
        $stmt->execute([$planId]);
        if ($stmt->fetch() === false) {
            $this->json(404, ['error' => 'Planificacion no encontrada']);
            return;
        }

        $errores = $this->validar($datos);
        if (!empty($errores)) {
            $this->json(422, ['errors' => $errores]);
            return;
        }

        $stmt = $this->db->prepare(
            'INSERT INTO avance_fisico (cantidad_ejecutada, porcentaje_avance, fecha, observaciones, id_planificacion)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            (float) $datos['cantidad_ejecutada'],
            (float) $datos['porcentaje_avance'],
            $datos['fecha'],
            $datos['observaciones'] ?? null,
            $planId,
        ]);

        $this->json(201, [
            'id_avance' => (int) $this->db->lastInsertId(),
            'id_planificacion' => (int) $planId,
            'cantidad_ejecutada' => (float) $datos['cantidad_ejecutada'],
            'porcentaje_avance' => (float) $datos['porcentaje_avance'],
            'fecha' => $datos['fecha'],
            'observaciones' => $datos['observaciones'] ?? null,
        ]);
    }

    /** GET /api/planificacion/avance/{id} */
    public function mostrar(string $id): void
    {
        $stmt = $this->db->prepare('SELECT * FROM avance_fisico WHERE id_avance = ?');
        $stmt->execute([$id]);
        $avance = $stmt->fetch();
        if ($avance === false) {
            $this->json(404, ['error' => 'Registro de avance no encontrado']);
            return;
        }
        $this->json(200, $this->normalizar($avance));
    }

    /** PUT /api/planificacion/avance/{id} */
    public function actualizar(string $id, array $datos): void
    {
        $stmt = $this->db->prepare('SELECT * FROM avance_fisico WHERE id_avance = ?');
        $stmt->execute([$id]);
        $actual = $stmt->fetch();
        if ($actual === false) {
            $this->json(404, ['error' => 'Registro de avance no encontrado']);
            return;
        }

        $errores = $this->validar($datos, true);
        if (!empty($errores)) {
            $this->json(422, ['errors' => $errores]);
            return;
        }

        $stmt = $this->db->prepare(
            'UPDATE avance_fisico SET cantidad_ejecutada = ?, porcentaje_avance = ?, fecha = ?, observaciones = ?
             WHERE id_avance = ?'
        );
        $stmt->execute([
            isset($datos['cantidad_ejecutada']) ? (float) $datos['cantidad_ejecutada'] : $actual['cantidad_ejecutada'],
            isset($datos['porcentaje_avance']) ? (float) $datos['porcentaje_avance'] : $actual['porcentaje_avance'],
            $datos['fecha'] ?? $actual['fecha'],
            array_key_exists('observaciones', $datos) ? $datos['observaciones'] : $actual['observaciones'],
            $id,
        ]);
        $this->json(200, ['mensaje' => 'Avance actualizado']);
    }

    /** DELETE /api/planificacion/avance/{id} */
    public function eliminar(string $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM avance_fisico WHERE id_avance = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) {
            $this->json(404, ['error' => 'Registro de avance no encontrado']);
            return;
        }
        $this->json(200, ['mensaje' => 'Avance eliminado']);
    }

    /** @param array<string,mixed> $datos @return array<string,string> */
    private function validar(array $datos, bool $parcial = false): array
    {
        $errores = [];
        $reglas = [
            'cantidad_ejecutada' => fn ($v) => is_numeric($v) && $v >= 0,
            'porcentaje_avance' => fn ($v) => is_numeric($v) && $v >= 0 && $v <= 100,
        ];
        foreach ($reglas as $campo => $ok) {
            if (isset($datos[$campo])) {
                if (!$ok($datos[$campo])) {
                    $errores[$campo] = 'Valor invalido';
                }
            } elseif (!$parcial) {
                $errores[$campo] = 'Obligatorio';
            }
        }
        if (isset($datos['fecha'])) {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $datos['fecha'])) {
                $errores['fecha'] = 'Formato esperado: YYYY-MM-DD';
            }
        } elseif (!$parcial) {
            $errores['fecha'] = 'Obligatorio';
        }
        return $errores;
    }

    /** @param array<string,mixed> $fila @return array<string,mixed> */
    private static function normalizar(array $fila): array
    {
        $fila['id_avance'] = (int) $fila['id_avance'];
        $fila['id_planificacion'] = (int) $fila['id_planificacion'];
        $fila['cantidad_ejecutada'] = (float) $fila['cantidad_ejecutada'];
        $fila['porcentaje_avance'] = (float) $fila['porcentaje_avance'];
        return $fila;
    }

    private function json(int $codigo, mixed $cuerpo): void
    {
        http_response_code($codigo);
        echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
    }
}
