<?php

declare(strict_types=1);

require_once __DIR__ . '/Jwt.php';

/**
 * Controlador de autenticacion (login). Equivalente PHP del backend de
 * login: valida credenciales contra la tabla `usuario`, compara la
 * contrasena con su hash bcrypt y emite un JWT. Base para RF19 (roles).
 *
 * Seguridad:
 *  - Las contrasenas se guardan SIEMPRE hasheadas (password_hash/bcrypt).
 *  - Ante un login fallido se responde un mensaje generico (no se revela
 *    si fallo el email o la contrasena).
 *  - El token nunca incluye el hash de la contrasena.
 */
final class AuthController
{
    private const ROLES = [
        'PersonalAdministrativo',
        'PersonalTecnico',
        'Gerente',
        'AdministradorSistema',
    ];

    public function __construct(
        private PDO $db,
        private string $jwtSecreto,
        private int $jwtSegundosValidez
    ) {
    }

    /** @param array<string, mixed> $datos */
    public function login(array $datos): void
    {
        $email = trim((string) ($datos['email'] ?? ''));
        $contrasena = (string) ($datos['contrasena'] ?? '');

        if ($email === '' || $contrasena === '') {
            $this->json(400, ['error' => 'Email y contrasena son obligatorios']);
            return;
        }

        $stmt = $this->db->prepare('SELECT * FROM usuario WHERE email = ?');
        $stmt->execute([$email]);
        $usuario = $stmt->fetch();

        if ($usuario === false) {
            $this->json(401, ['error' => 'Credenciales invalidas']);
            return;
        }

        if ((int) $usuario['activo'] !== 1) {
            $this->json(403, ['error' => 'Usuario inactivo']);
            return;
        }

        if (!password_verify($contrasena, $usuario['contrasena'])) {
            $this->json(401, ['error' => 'Credenciales invalidas']);
            return;
        }

        // Sesion unica: generamos un id de sesion nuevo y lo guardamos. Esto
        // invalida cualquier sesion anterior del usuario (el ultimo login gana).
        $sid = bin2hex(random_bytes(16));
        $upd = $this->db->prepare('UPDATE usuario SET sesion_token = ? WHERE id_usuario = ?');
        $upd->execute([$sid, (int) $usuario['id_usuario']]);

        $token = Jwt::generar(
            [
                'id_usuario' => (int) $usuario['id_usuario'],
                'email' => $usuario['email'],
                'rol' => $usuario['rol'],
                'sid' => $sid,
            ],
            $this->jwtSecreto,
            $this->jwtSegundosValidez
        );

        $this->json(200, [
            'token' => $token,
            'usuario' => [
                'id_usuario' => (int) $usuario['id_usuario'],
                'nombre' => $usuario['nombre'],
                'email' => $usuario['email'],
                'rol' => $usuario['rol'],
            ],
        ]);
    }

    /**
     * Crea un usuario. Solo lo puede hacer un AdministradorSistema.
     * @param array<string, mixed> $datos
     * @param array<string, mixed> $solicitante  payload del token (ya validado)
     */
    public function registrar(array $datos, array $solicitante): void
    {
        if (($solicitante['rol'] ?? '') !== 'AdministradorSistema') {
            $this->json(403, ['error' => 'No tenes permisos para esta accion']);
            return;
        }

        $nombre = trim((string) ($datos['nombre'] ?? ''));
        $email = trim((string) ($datos['email'] ?? ''));
        $contrasena = (string) ($datos['contrasena'] ?? '');
        $rol = (string) ($datos['rol'] ?? '');

        $errores = [];
        if ($nombre === '') {
            $errores['nombre'] = 'Obligatorio';
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errores['email'] = 'Email invalido';
        }
        if (strlen($contrasena) < 6) {
            $errores['contrasena'] = 'Debe tener al menos 6 caracteres';
        }
        if (!in_array($rol, self::ROLES, true)) {
            $errores['rol'] = 'Rol invalido';
        }
        if (!empty($errores)) {
            $this->json(422, ['errors' => $errores]);
            return;
        }

        $stmt = $this->db->prepare('SELECT id_usuario FROM usuario WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch() !== false) {
            $this->json(409, ['error' => 'Ya existe un usuario con ese email']);
            return;
        }

        $hash = password_hash($contrasena, PASSWORD_BCRYPT);
        $stmt = $this->db->prepare('INSERT INTO usuario (nombre, email, contrasena, rol) VALUES (?, ?, ?, ?)');
        $stmt->execute([$nombre, $email, $hash, $rol]);

        $this->json(201, [
            'id_usuario' => (int) $this->db->lastInsertId(),
            'nombre' => $nombre,
            'email' => $email,
            'rol' => $rol,
        ]);
    }

    /** @param array<string, mixed> $solicitante */
    public function yo(array $solicitante): void
    {
        // Sesion unica: el id de sesion del token debe coincidir con el ultimo
        // guardado en la base. Si no, hubo un login mas nuevo en otro lado.
        $stmt = $this->db->prepare('SELECT sesion_token FROM usuario WHERE id_usuario = ?');
        $stmt->execute([(int) ($solicitante['id_usuario'] ?? 0)]);
        $fila = $stmt->fetch();

        if ($fila === false || ($solicitante['sid'] ?? null) !== $fila['sesion_token']) {
            $this->json(401, ['error' => 'Tu sesión se cerró: se inició sesión en otro dispositivo']);
            return;
        }

        $this->json(200, ['usuario' => $solicitante]);
    }

    private function json(int $codigoHttp, mixed $cuerpo): void
    {
        http_response_code($codigoHttp);
        echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
    }
}
