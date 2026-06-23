<?php

declare(strict_types=1);

/**
 * Reportes operativos de obra con flujo de aprobacion (RF21) y observaciones
 * del revisor (RF17).
 *
 * Ciclo de vida del reporte (coincide con el diseno del TP3):
 *   borrador --enviar--> en_revision --aprobar--> aprobado
 *                                    --rechazar-> rechazado --enviar--> en_revision
 *
 * El autor (personal de obra) crea, edita y envia; el supervisor
 * (PersonalAdministrativo) aprueba o rechaza dejando una observacion.
 */
final class ReporteController
{
    public function __construct(private PDO $db)
    {
    }

    private const SELECT =
        'SELECT r.id_reporte, r.id_proyecto, p.nombre AS proyecto, r.id_usuario,
                u.nombre AS autor, r.titulo, r.contenido, r.estado,
                r.observacion_revision, r.fecha_creacion, r.fecha_revision
         FROM reporte r
         JOIN proyecto p ON p.id_proyecto = r.id_proyecto
         JOIN usuario u ON u.id_usuario = r.id_usuario';

    /** GET /api/reportes[?estado=...] */
    public function listar(?string $estado): void
    {
        if ($estado !== null && $estado !== '') {
            $stmt = $this->db->prepare(self::SELECT . ' WHERE r.estado = ? ORDER BY r.fecha_creacion DESC');
            $stmt->execute([$estado]);
        } else {
            $stmt = $this->db->query(self::SELECT . ' ORDER BY r.fecha_creacion DESC');
        }
        $this->json(200, array_map([self::class, 'normalizar'], $stmt->fetchAll()));
    }

    /**
     * POST /api/reportes  -> crea un reporte en estado borrador.
     * @param array<string,mixed> $datos
     * @param array<string,mixed> $usuario  payload del token (autor)
     */
    public function crear(array $datos, array $usuario): void
    {
        $idProyecto = $datos['id_proyecto'] ?? null;
        $titulo = trim((string) ($datos['titulo'] ?? ''));
        $contenido = trim((string) ($datos['contenido'] ?? ''));

        $errores = [];
        if (!is_numeric($idProyecto)) { $errores['id_proyecto'] = 'Seleccioná una obra'; }
        if ($titulo === '') { $errores['titulo'] = 'Obligatorio'; }
        if ($contenido === '') { $errores['contenido'] = 'Obligatorio'; }
        if (!empty($errores)) { $this->json(422, ['errors' => $errores]); return; }

        $stmt = $this->db->prepare('SELECT id_proyecto FROM proyecto WHERE id_proyecto = ?');
        $stmt->execute([$idProyecto]);
        if ($stmt->fetch() === false) { $this->json(404, ['error' => 'Obra no encontrada']); return; }

        $stmt = $this->db->prepare('INSERT INTO reporte (id_proyecto, id_usuario, titulo, contenido) VALUES (?, ?, ?, ?)');
        $stmt->execute([$idProyecto, (int) ($usuario['id_usuario'] ?? 0), $titulo, $contenido]);

        $this->mostrarPorId((int) $this->db->lastInsertId(), 201);
    }

    /** PUT /api/reportes/{id}  -> editar (solo en borrador o rechazado). */
    public function editar(string $id, array $datos): void
    {
        $actual = $this->buscar($id);
        if ($actual === null) { $this->json(404, ['error' => 'Reporte no encontrado']); return; }
        if (!in_array($actual['estado'], ['borrador', 'rechazado'], true)) {
            $this->json(409, ['error' => 'Solo se puede editar un reporte en borrador o rechazado']);
            return;
        }

        $titulo = trim((string) ($datos['titulo'] ?? $actual['titulo']));
        $contenido = trim((string) ($datos['contenido'] ?? $actual['contenido']));
        if ($titulo === '' || $contenido === '') {
            $this->json(422, ['error' => 'Título y contenido son obligatorios']);
            return;
        }

        $stmt = $this->db->prepare('UPDATE reporte SET titulo = ?, contenido = ? WHERE id_reporte = ?');
        $stmt->execute([$titulo, $contenido, $id]);
        $this->mostrarPorId((int) $id, 200);
    }

    /** POST /api/reportes/{id}/enviar  -> manda a revision. */
    public function enviar(string $id): void
    {
        $actual = $this->buscar($id);
        if ($actual === null) { $this->json(404, ['error' => 'Reporte no encontrado']); return; }
        if (!in_array($actual['estado'], ['borrador', 'rechazado'], true)) {
            $this->json(409, ['error' => 'El reporte ya fue enviado a revisión']);
            return;
        }
        $this->db->prepare('UPDATE reporte SET estado = ?, observacion_revision = NULL WHERE id_reporte = ?')
            ->execute(['en_revision', $id]);
        $this->mostrarPorId((int) $id, 200);
    }

    /** POST /api/reportes/{id}/aprobar  -> solo desde en_revision. */
    public function aprobar(string $id, array $datos): void
    {
        $this->resolver($id, 'aprobado', $datos['observacion'] ?? null);
    }

    /** POST /api/reportes/{id}/rechazar  -> solo desde en_revision (observacion obligatoria). */
    public function rechazar(string $id, array $datos): void
    {
        $obs = trim((string) ($datos['observacion'] ?? ''));
        if ($obs === '') {
            $this->json(422, ['errors' => ['observacion' => 'Indicá el motivo del rechazo']]);
            return;
        }
        $this->resolver($id, 'rechazado', $obs);
    }

    /** DELETE /api/reportes/{id} */
    public function eliminar(string $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM reporte WHERE id_reporte = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) { $this->json(404, ['error' => 'Reporte no encontrado']); return; }
        $this->json(200, ['mensaje' => 'Reporte eliminado']);
    }

    /** Aplica una resolucion (aprobado/rechazado) validando que este en revision. */
    private function resolver(string $id, string $nuevoEstado, ?string $observacion): void
    {
        $actual = $this->buscar($id);
        if ($actual === null) { $this->json(404, ['error' => 'Reporte no encontrado']); return; }
        if ($actual['estado'] !== 'en_revision') {
            $this->json(409, ['error' => 'Solo se pueden resolver reportes en revisión']);
            return;
        }
        $stmt = $this->db->prepare('UPDATE reporte SET estado = ?, observacion_revision = ?, fecha_revision = NOW() WHERE id_reporte = ?');
        $stmt->execute([$nuevoEstado, $observacion, $id]);
        $this->mostrarPorId((int) $id, 200);
    }

    /** @return array<string,mixed>|null */
    private function buscar(string $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM reporte WHERE id_reporte = ?');
        $stmt->execute([$id]);
        $fila = $stmt->fetch();
        return $fila === false ? null : $fila;
    }

    private function mostrarPorId(int $id, int $codigo): void
    {
        $stmt = $this->db->prepare(self::SELECT . ' WHERE r.id_reporte = ?');
        $stmt->execute([$id]);
        $fila = $stmt->fetch();
        if ($fila === false) { $this->json(404, ['error' => 'Reporte no encontrado']); return; }
        $this->json($codigo, self::normalizar($fila));
    }

    /** @param array<string,mixed> $f @return array<string,mixed> */
    private static function normalizar(array $f): array
    {
        $f['id_reporte'] = (int) $f['id_reporte'];
        $f['id_proyecto'] = (int) $f['id_proyecto'];
        $f['id_usuario'] = (int) $f['id_usuario'];
        return $f;
    }

    private function json(int $codigo, mixed $cuerpo): void
    {
        http_response_code($codigo);
        echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
    }
}
