<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/Env.php';
require_once __DIR__ . '/../src/Cors.php';
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Jwt.php';
require_once __DIR__ . '/../src/AuthMiddleware.php';
require_once __DIR__ . '/../src/AuthController.php';
require_once __DIR__ . '/../src/ProyectoRepositoryInterface.php';
require_once __DIR__ . '/../src/MySqlProyectoRepository.php';
require_once __DIR__ . '/../src/ProyectoController.php';
require_once __DIR__ . '/../src/PlanificacionController.php';
require_once __DIR__ . '/../src/AvanceController.php';

Env::cargar(__DIR__ . '/../.env');

// El servidor (ej. Render) suele correr en UTC. Fijamos la zona horaria local
// para que las validaciones de fecha (ej. "no anterior a hoy") usen la fecha
// correcta del usuario y no la de UTC.
date_default_timezone_set('America/Argentina/Buenos_Aires');

Cors::enviarHeaders();

// Bajo el servidor embebido de PHP (php -S, mono-hilo) cerramos la conexion
// despues de cada respuesta para que no se bloquee con las conexiones del
// navegador. En Apache/produccion no aplica (se mantiene keep-alive).
if (php_sapi_name() === 'cli-server') {
    header('Connection: close');
}

// Preflight CORS (el navegador manda OPTIONS antes de POST/PUT/DELETE).
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

// --- Configuracion / dependencias ---
$jwtSecreto = Env::get('JWT_SECRET', 'cambiar_esta_clave');
$jwtSegundos = (int) Env::get('JWT_SEGUNDOS', '28800'); // 8 horas por defecto

// Grupos de roles autorizados (RF19). El AdministradorSistema es superusuario.
const ROLES_GESTION_OBRA = ['AdministradorSistema', 'PersonalAdministrativo']; // crear/editar/eliminar obra y planificacion
const ROLES_AVANCE = ['AdministradorSistema', 'PersonalTecnico'];              // registrar/editar/eliminar avance fisico

$db = Database::conexion();

$controlador = new ProyectoController(new MySqlProyectoRepository($db));
$auth = new AuthController($db, $jwtSecreto, $jwtSegundos);
$planificacion = new PlanificacionController($db);
$avance = new AvanceController($db);

// --- Parseo de la ruta ---
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
$uri = rtrim($uri, '/');
$ruta = preg_replace('#^/api#', '', $uri);

$segmentos = array_values(array_filter(explode('/', $ruta)));
$metodoHttp = $_SERVER['REQUEST_METHOD'];
$recurso = $segmentos[0] ?? null;

// ============================================================
//  Autenticacion:  /auth/login, /auth/register, /auth/me
// ============================================================
if ($recurso === 'auth') {
    $accion = $segmentos[1] ?? null;

    switch (true) {
        case $metodoHttp === 'POST' && $accion === 'login':
            $auth->login(leerCuerpoJson());
            break;

        case $metodoHttp === 'POST' && $accion === 'olvide':
            $auth->olvide(leerCuerpoJson());
            break;

        case $metodoHttp === 'POST' && $accion === 'restablecer':
            $auth->restablecer(leerCuerpoJson());
            break;

        case $metodoHttp === 'POST' && $accion === 'register':
            $solicitante = AuthMiddleware::usuarioAutenticado($jwtSecreto);
            if ($solicitante === null) { noAutenticado(); break; }
            $auth->registrar(leerCuerpoJson(), $solicitante);
            break;

        case $metodoHttp === 'GET' && $accion === 'me':
            $solicitante = AuthMiddleware::usuarioAutenticado($jwtSecreto);
            if ($solicitante === null) { noAutenticado(); break; }
            $auth->yo($solicitante);
            break;

        default:
            responder(404, ['error' => 'Ruta de autenticacion no encontrada']);
    }
    exit;
}

// ============================================================
//  Health-check
// ============================================================
if ($recurso === 'health') {
    echo json_encode(['status' => 'ok']);
    exit;
}

// ============================================================
//  Planificacion y Avances:  /planificacion/...
// ============================================================
if ($recurso === 'planificacion') {
    $usuario = exigirAutenticacion($jwtSecreto);

    // /planificacion/avance/{id}  -> un avance puntual
    if (($segmentos[1] ?? null) === 'avance') {
        $idAvance = $segmentos[2] ?? null;
        if ($idAvance === null) { responder(404, ['error' => 'Falta el id del avance']); exit; }
        switch ($metodoHttp) {
            case 'GET':    $avance->mostrar($idAvance); break;
            case 'PUT':    exigirRol($usuario, ROLES_AVANCE); $avance->actualizar($idAvance, leerCuerpoJson()); break;
            case 'DELETE': exigirRol($usuario, ROLES_AVANCE); $avance->eliminar($idAvance); break;
            default:       responder(405, ['error' => 'Metodo no permitido']);
        }
        exit;
    }

    // /planificacion/{planId}/avances[/resumen]
    if (($segmentos[2] ?? null) === 'avances') {
        $planId = $segmentos[1];
        if (($segmentos[3] ?? null) === 'resumen') {
            if ($metodoHttp === 'GET') { $avance->resumen($planId); }
            else { responder(405, ['error' => 'Metodo no permitido']); }
            exit;
        }
        switch ($metodoHttp) {
            case 'GET':  $avance->listarPorPlan($planId); break;
            case 'POST': exigirRol($usuario, ROLES_AVANCE); $avance->crear($planId, leerCuerpoJson()); break;
            default:     responder(405, ['error' => 'Metodo no permitido']);
        }
        exit;
    }

    // /planificacion/{id}  -> PUT / DELETE de la planificacion
    $idPlan = $segmentos[1] ?? null;
    if ($idPlan === null) { responder(404, ['error' => 'Falta el id de planificacion']); exit; }
    switch ($metodoHttp) {
        case 'PUT':    exigirRol($usuario, ROLES_GESTION_OBRA); $planificacion->actualizar($idPlan, leerCuerpoJson()); break;
        case 'DELETE': exigirRol($usuario, ROLES_GESTION_OBRA); $planificacion->eliminar($idPlan); break;
        default:       responder(405, ['error' => 'Metodo no permitido']);
    }
    exit;
}

// ============================================================
//  Proyectos:  /proyectos  y  /proyectos/{id}/planificacion
// ============================================================
if ($recurso === 'proyectos') {
    $usuario = exigirAutenticacion($jwtSecreto);
    $id = $segmentos[1] ?? null;

    // Sub-recurso: /proyectos/{id}/planificacion
    if (($segmentos[2] ?? null) === 'planificacion') {
        switch ($metodoHttp) {
            case 'GET':  $planificacion->obtenerPorProyecto($id); break;
            case 'POST': exigirRol($usuario, ROLES_GESTION_OBRA); $planificacion->crear($id, leerCuerpoJson()); break;
            default:     responder(405, ['error' => 'Metodo no permitido']);
        }
        exit;
    }

    switch (true) {
        case $metodoHttp === 'GET' && $id === null:    $controlador->listar($_GET['q'] ?? null, $usuario['rol'] ?? null); break;
        case $metodoHttp === 'GET' && $id !== null:    $controlador->mostrar($id, $usuario['rol'] ?? null); break;
        case $metodoHttp === 'POST' && $id === null:   exigirRol($usuario, ROLES_GESTION_OBRA); $controlador->registrar(leerCuerpoJson()); break;
        case $metodoHttp === 'PUT' && $id !== null:    exigirRol($usuario, ROLES_GESTION_OBRA); $controlador->modificar($id, leerCuerpoJson()); break;
        case $metodoHttp === 'DELETE' && $id !== null: exigirRol($usuario, ROLES_GESTION_OBRA); $controlador->eliminar($id); break;
        default: responder(405, ['error' => 'Metodo no permitido para esta ruta']);
    }
    exit;
}

responder(404, ['error' => 'Recurso no encontrado']);

// ------------------------------------------------------------
/** @return array<string, mixed> */
function leerCuerpoJson(): array
{
    $datos = json_decode(file_get_contents('php://input'), true);
    return is_array($datos) ? $datos : [];
}
function responder(int $codigo, mixed $cuerpo): void
{
    http_response_code($codigo);
    echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
}
function noAutenticado(): void
{
    responder(401, ['error' => 'Falta el token de autenticacion']);
}
/**
 * Exige un token valido. Si no lo hay, corta con 401. Devuelve el payload
 * del usuario (id_usuario, email, rol) para usarlo en las guardas de rol.
 * @return array<string, mixed>
 */
function exigirAutenticacion(string $secreto): array
{
    $usuario = AuthMiddleware::usuarioAutenticado($secreto);
    if ($usuario === null) { noAutenticado(); exit; }
    return $usuario;
}
/**
 * Exige que el rol del usuario este dentro de los permitidos (RF19).
 * Si no, corta con 403.
 * @param array<string, mixed> $usuario
 * @param array<int, string> $rolesPermitidos
 */
function exigirRol(array $usuario, array $rolesPermitidos): void
{
    if (!in_array($usuario['rol'] ?? '', $rolesPermitidos, true)) {
        responder(403, ['error' => 'No tenés permisos para esta acción']);
        exit;
    }
}
