<?php

declare(strict_types=1);

/**
 * Periodos de inactividad de la obra con su motivo (RF25). Sirven para
 * justificar paradas y contextualizar desvios de avance.
 */
final class InactividadController
{
    public function __construct(private PDO $db)
    {
    }

    /** GET /api/proyectos/{idProyecto}/inactividades */
    public function listarPorProyecto(string $idProyecto): void
    {
        $stmt = $this->db->prepare('SELECT * FROM periodo_inactividad WHERE id_proyecto = ? ORDER BY fecha_inicio DESC, id_periodo DESC');
        $stmt->execute([$idProyecto]);
        $this->json(200, array_map([self::class, 'normalizar'], $stmt->fetchAll()));
    }

    /** POST /api/proyectos/{idProyecto}/inactividades */
    public function crear(string $idProyecto, array $datos): void
    {
        $stmt = $this->db->prepare('SELECT id_proyecto FROM proyecto WHERE id_proyecto = ?');
        $stmt->execute([$idProyecto]);
        if ($stmt->fetch() === false) { $this->json(404, ['error' => 'Obra no encontrada']); return; }

        $inicio = (string) ($datos['fecha_inicio'] ?? '');
        $fin = trim((string) ($datos['fecha_fin'] ?? ''));
        $motivo = trim((string) ($datos['motivo'] ?? ''));

        $errores = [];
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $inicio)) { $errores['fecha_inicio'] = 'Formato esperado: YYYY-MM-DD'; }
        if ($fin !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fin)) { $errores['fecha_fin'] = 'Formato esperado: YYYY-MM-DD'; }
        if ($fin !== '' && $fin < $inicio) { $errores['fecha_fin'] = 'La fecha de fin no puede ser anterior al inicio'; }
        if ($motivo === '') { $errores['motivo'] = 'Obligatorio'; }
        if (!empty($errores)) { $this->json(422, ['errors' => $errores]); return; }

        $stmt = $this->db->prepare('INSERT INTO periodo_inactividad (id_proyecto, fecha_inicio, fecha_fin, motivo) VALUES (?, ?, ?, ?)');
        $stmt->execute([$idProyecto, $inicio, $fin !== '' ? $fin : null, $motivo]);

        $this->json(201, [
            'id_periodo' => (int) $this->db->lastInsertId(),
            'id_proyecto' => (int) $idProyecto,
            'fecha_inicio' => $inicio,
            'fecha_fin' => $fin !== '' ? $fin : null,
            'motivo' => $motivo,
        ]);
    }

    /** DELETE /api/proyectos/inactividad/{id} */
    public function eliminar(string $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM periodo_inactividad WHERE id_periodo = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) { $this->json(404, ['error' => 'Período no encontrado']); return; }
        $this->json(200, ['mensaje' => 'Período eliminado']);
    }

    /** @param array<string,mixed> $f @return array<string,mixed> */
    private static function normalizar(array $f): array
    {
        $f['id_periodo'] = (int) $f['id_periodo'];
        $f['id_proyecto'] = (int) $f['id_proyecto'];
        return $f;
    }

    private function json(int $codigo, mixed $cuerpo): void
    {
        http_response_code($codigo);
        echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
    }
}
