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

Env::cargar(__DIR__ . '/../.env');

Cors::enviarHeaders();

// Preflight CORS (el navegador manda OPTIONS antes de POST/PUT/DELETE).
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

// --- Configuracion / dependencias ---
$jwtSecreto = Env::get('JWT_SECRET', 'cambiar_esta_clave');
$jwtSegundos = (int) Env::get('JWT_SEGUNDOS', '28800'); // 8 horas por defecto

$db = Database::conexion();

// Repositorio MariaDB (antes era JsonProyectoRepository; el controlador no cambia).
$repositorio = new MySqlProyectoRepository($db);
$controlador = new ProyectoController($repositorio);
$auth = new AuthController($db, $jwtSecreto, $jwtSegundos);

// --- Parseo de la ruta ---
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
$uri = rtrim($uri, '/');
$ruta = preg_replace('#^/api#', '', $uri);

$segmentos = array_values(array_filter(explode('/', $ruta)));
$metodoHttp = $_SERVER['REQUEST_METHOD'];
$recurso = $segmentos[0] ?? null;

// ============================================================
//  Rutas de autenticacion:  /auth/login, /auth/register, /auth/me
// ============================================================
if ($recurso === 'auth') {
    $accion = $segmentos[1] ?? null;

    switch (true) {
        case $metodoHttp === 'POST' && $accion === 'login':
            $auth->login(leerCuerpoJson());
            break;

        case $metodoHttp === 'POST' && $accion === 'register':
            $solicitante = AuthMiddleware::usuarioAutenticado($jwtSecreto);
            if ($solicitante === null) {
                http_response_code(401);
                echo json_encode(['error' => 'Falta el token de autenticacion']);
                break;
            }
            $auth->registrar(leerCuerpoJson(), $solicitante);
            break;

        case $metodoHttp === 'GET' && $accion === 'me':
            $solicitante = AuthMiddleware::usuarioAutenticado($jwtSecreto);
            if ($solicitante === null) {
                http_response_code(401);
                echo json_encode(['error' => 'Falta el token de autenticacion']);
                break;
            }
            $auth->yo($solicitante);
            break;

        default:
            http_response_code(404);
            echo json_encode(['error' => 'Ruta de autenticacion no encontrada']);
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
//  Rutas de proyectos:  /proyectos  (RF01)
// ============================================================
if ($recurso !== 'proyectos') {
    http_response_code(404);
    echo json_encode(['error' => 'Recurso no encontrado']);
    exit;
}

$id = $segmentos[1] ?? null;

switch (true) {
    case $metodoHttp === 'GET' && $id === null:
        $controlador->listar($_GET['q'] ?? null);
        break;

    case $metodoHttp === 'GET' && $id !== null:
        $controlador->mostrar($id);
        break;

    case $metodoHttp === 'POST' && $id === null:
        $controlador->registrar(leerCuerpoJson());
        break;

    case $metodoHttp === 'PUT' && $id !== null:
        $controlador->modificar($id, leerCuerpoJson());
        break;

    case $metodoHttp === 'DELETE' && $id !== null:
        $controlador->eliminar($id);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Metodo no permitido para esta ruta']);
}

/** @return array<string, mixed> */
function leerCuerpoJson(): array
{
    $input = file_get_contents('php://input');
    $datos = json_decode($input, true);
    return is_array($datos) ? $datos : [];
}
