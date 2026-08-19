<?php

declare(strict_types=1);

/**
 * Catalogo global de materiales (RF04). No depende de una obra: es la lista
 * precargada (y ampliable) desde la cual se asignan materiales a las obras.
 */
final class MaterialController
{
    public function __construct(private PDO $db)
    {
    }

    /** GET /api/materiales */
    public function listar(): void
    {
        $stmt = $this->db->query('SELECT id_material, nombre, unidad FROM material ORDER BY nombre');
        $this->json(200, array_map([self::class, 'normalizar'], $stmt->fetchAll()));
    }

    /** POST /api/materiales */
    public function crear(array $datos): void
    {
        $nombre = trim((string) ($datos['nombre'] ?? ''));
        $unidad = trim((string) ($datos['unidad'] ?? ''));

        $errores = [];
        if ($nombre === '') { $errores['nombre'] = 'Obligatorio'; }
        if ($unidad === '') { $errores['unidad'] = 'Obligatorio'; }
        if (!empty($errores)) { $this->json(422, ['errors' => $errores]); return; }

        $stmt = $this->db->prepare('SELECT id_material FROM material WHERE LOWER(nombre) = LOWER(?)');
        $stmt->execute([$nombre]);
        if ($stmt->fetch() !== false) {
            $this->json(409, ['error' => 'Ya existe un material con ese nombre']);
            return;
        }

        $stmt = $this->db->prepare('INSERT INTO material (nombre, unidad) VALUES (?, ?)');
        $stmt->execute([$nombre, $unidad]);

        $this->json(201, ['id_material' => (int) $this->db->lastInsertId(), 'nombre' => $nombre, 'unidad' => $unidad]);
    }

    /** @param array<string,mixed> $fila @return array<string,mixed> */
    private static function normalizar(array $fila): array
    {
        $fila['id_material'] = (int) $fila['id_material'];
        return $fila;
    }

    private function json(int $codigo, mixed $cuerpo): void
    {
        http_response_code($codigo);
        echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
    }
}
