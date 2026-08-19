<?php

declare(strict_types=1);

/**
 * Gestion de usuarios (HU16, completa RF19). Solo el AdministradorSistema.
 *
 * El alta se hace por POST /api/auth/register (AuthController); aca van el
 * listado, el cambio de rol y la baja logica. Nunca se devuelve el hash de
 * la contrasena.
 */
final class UsuarioController
{
    private const ROLES_VALIDOS = [
        'PersonalAdministrativo',
        'PersonalTecnico',
        'Gerente',
        'AdministradorSistema',
    ];

    public function __construct(private PDO $db)
    {
    }

    /** GET /api/usuarios */
    public function listar(): void
    {
        $stmt = $this->db->query(
            'SELECT id_usuario, nombre, email, rol, activo, fecha_creacion
             FROM usuario ORDER BY nombre'
        );
        $this->json(200, array_map([self::class, 'normalizar'], $stmt->fetchAll()));
    }

    /**
     * PUT /api/usuarios/{id}  -> cambiar rol y/o dar de baja/alta logica.
     * @param array<string,mixed> $datos
     * @param array<string,mixed> $solicitante  payload del token (quien pide el cambio)
     */
    public function actualizar(string $id, array $datos, array $solicitante): void
    {
        $stmt = $this->db->prepare('SELECT id_usuario, rol, activo FROM usuario WHERE id_usuario = ?');
        $stmt->execute([$id]);
        $actual = $stmt->fetch();
        if ($actual === false) {
            $this->json(404, ['error' => 'Usuario no encontrado']);
            return;
        }

        $tieneRol = array_key_exists('rol', $datos);
        $tieneActivo = array_key_exists('activo', $datos);
        if (!$tieneRol && !$tieneActivo) {
            $this->json(422, ['error' => 'Indicá al menos un campo para actualizar (rol o activo)']);
            return;
        }
        if ($tieneRol && !in_array($datos['rol'], self::ROLES_VALIDOS, true)) {
            $this->json(422, ['errors' => ['rol' => 'Rol inválido']]);
            return;
        }

        $nuevoRol = $tieneRol ? (string) $datos['rol'] : (string) $actual['rol'];
        $nuevoActivo = $tieneActivo ? (!empty($datos['activo']) ? 1 : 0) : (int) $actual['activo'];

        // Salvaguarda: un admin no puede quitarse a si mismo el acceso.
        $esUnoMismo = (int) ($solicitante['id_usuario'] ?? 0) === (int) $id;
        if ($esUnoMismo && ($nuevoActivo === 0 || $nuevoRol !== 'AdministradorSistema')) {
            $this->json(409, ['error' => 'No podés quitarte a vos mismo el acceso de administrador']);
            return;
        }

        // Tampoco dejamos el sistema sin ningun administrador activo.
        $dejaDeSerAdmin = $actual['rol'] === 'AdministradorSistema'
            && ($nuevoRol !== 'AdministradorSistema' || $nuevoActivo === 0);
        if ($dejaDeSerAdmin) {
            $stmt = $this->db->prepare(
                "SELECT COUNT(*) FROM usuario
                 WHERE rol = 'AdministradorSistema' AND activo = 1 AND id_usuario <> ?"
            );
            $stmt->execute([$id]);
            if ((int) $stmt->fetchColumn() === 0) {
                $this->json(409, ['error' => 'Debe quedar al menos un administrador activo']);
                return;
            }
        }

        // Al cambiar rol o desactivar se corta la sesion vigente, para que el
        // cambio tenga efecto de inmediato.
        $this->db->prepare('UPDATE usuario SET rol = ?, activo = ?, sesion_token = NULL WHERE id_usuario = ?')
            ->execute([$nuevoRol, $nuevoActivo, $id]);

        $stmt = $this->db->prepare(
            'SELECT id_usuario, nombre, email, rol, activo FROM usuario WHERE id_usuario = ?'
        );
        $stmt->execute([$id]);
        $this->json(200, self::normalizar($stmt->fetch()));
    }

    /** @param array<string,mixed> $f @return array<string,mixed> */
    private static function normalizar(array $f): array
    {
        $f['id_usuario'] = (int) $f['id_usuario'];
        $f['activo'] = (int) $f['activo'] === 1;
        return $f;
    }

    private function json(int $codigo, mixed $cuerpo): void
    {
        http_response_code($codigo);
        echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
    }
}
