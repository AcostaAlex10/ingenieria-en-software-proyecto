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
require_once __DIR__ . '/../src/AsistenciaController.php';
require_once __DIR__ . '/../src/IncidenciaController.php';
require_once __DIR__ . '/../src/MaterialController.php';
require_once __DIR__ . '/../src/MaterialObraController.php';
require_once __DIR__ . '/../src/DocumentoController.php';
require_once __DIR__ . '/../src/ReporteController.php';
require_once __DIR__ . '/../src/InactividadController.php';
require_once __DIR__ . '/../src/ItemExcedenteController.php';
require_once __DIR__ . '/../src/AnalisisController.php';

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
const ROLES_GESTION_OBRA = ['AdministradorSistema', 'PersonalAdministrativo']; // crear/editar/eliminar obra, planificacion y materiales
const ROLES_AVANCE = ['AdministradorSistema', 'PersonalTecnico'];              // registrar avance, asistencia, incidencias y consumos
const ROLES_DOC = ['AdministradorSistema', 'PersonalAdministrativo', 'PersonalTecnico']; // cargar documentacion, reportes, inactividad y excedentes (todos menos Gerente)
const ROLES_REPORTE_APROBAR = ['AdministradorSistema', 'PersonalAdministrativo'];        // aprobar/rechazar reportes (RF21)

$db = Database::conexion();

$controlador = new ProyectoController(new MySqlProyectoRepository($db));
$auth = new AuthController($db, $jwtSecreto, $jwtSegundos);
$planificacion = new PlanificacionController($db);
$avance = new AvanceController($db);
$asistencia = new AsistenciaController($db);
$incidencia = new IncidenciaController($db);
$material = new MaterialController($db);
$materialObra = new MaterialObraController($db);
$documento = new DocumentoController($db);
$reporte = new ReporteController($db);
$inactividad = new InactividadController($db);
$itemExcedente = new ItemExcedenteController($db);
$analisis = new AnalisisController($db);

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
//  Reportes y aprobacion:  /reportes  (RF21/RF17)
// ============================================================
if ($recurso === 'reportes') {
    $usuario = exigirAutenticacion($jwtSecreto);
    $idRep = $segmentos[1] ?? null;
    $accion = $segmentos[2] ?? null;

    if ($idRep === null) {
        switch ($metodoHttp) {
            case 'GET':  $reporte->listar($_GET['estado'] ?? null); break;
            case 'POST': exigirRol($usuario, ROLES_DOC); $reporte->crear(leerCuerpoJson(), $usuario); break;
            default:     responder(405, ['error' => 'Metodo no permitido']);
        }
        exit;
    }

    // Acciones del flujo: enviar / aprobar / rechazar
    if ($accion === 'enviar') {
        if ($metodoHttp === 'POST') { exigirRol($usuario, ROLES_DOC); $reporte->enviar($idRep); }
        else { responder(405, ['error' => 'Metodo no permitido']); }
        exit;
    }
    if ($accion === 'aprobar') {
        if ($metodoHttp === 'POST') { exigirRol($usuario, ROLES_REPORTE_APROBAR); $reporte->aprobar($idRep, leerCuerpoJson()); }
        else { responder(405, ['error' => 'Metodo no permitido']); }
        exit;
    }
    if ($accion === 'rechazar') {
        if ($metodoHttp === 'POST') { exigirRol($usuario, ROLES_REPORTE_APROBAR); $reporte->rechazar($idRep, leerCuerpoJson()); }
        else { responder(405, ['error' => 'Metodo no permitido']); }
        exit;
    }

    // /reportes/{id}  -> editar / eliminar
    switch ($metodoHttp) {
        case 'PUT':    exigirRol($usuario, ROLES_DOC); $reporte->editar($idRep, leerCuerpoJson()); break;
        case 'DELETE': exigirRol($usuario, ROLES_DOC); $reporte->eliminar($idRep); break;
        default:       responder(405, ['error' => 'Metodo no permitido']);
    }
    exit;
}

// ============================================================
//  Analisis y alertas:  /analisis  (RF11/RF13)
// ============================================================
if ($recurso === 'analisis') {
    $usuario = exigirAutenticacion($jwtSecreto);
    if ($metodoHttp === 'GET') { $analisis->resumen($usuario['rol'] ?? null); }
    else { responder(405, ['error' => 'Metodo no permitido']); }
    exit;
}

// ============================================================
//  Catalogo de materiales:  /materiales  (RF04)
// ============================================================
if ($recurso === 'materiales') {
    $usuario = exigirAutenticacion($jwtSecreto);
    switch ($metodoHttp) {
        case 'GET':  $material->listar(); break;
        case 'POST': exigirRol($usuario, ROLES_GESTION_OBRA); $material->crear(leerCuerpoJson()); break;
        default:     responder(405, ['error' => 'Metodo no permitido']);
    }
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

    // /proyectos/asistencia/{id}  -> DELETE de un registro de asistencia
    if ($id === 'asistencia') {
        $aid = $segmentos[2] ?? null;
        if ($aid === null) { responder(404, ['error' => 'Falta el id de asistencia']); exit; }
        if ($metodoHttp === 'DELETE') { exigirRol($usuario, ROLES_AVANCE); $asistencia->eliminar($aid); }
        else { responder(405, ['error' => 'Metodo no permitido']); }
        exit;
    }

    // /proyectos/incidencia/{id}  -> DELETE de una incidencia
    if ($id === 'incidencia') {
        $iid = $segmentos[2] ?? null;
        if ($iid === null) { responder(404, ['error' => 'Falta el id de incidencia']); exit; }
        if ($metodoHttp === 'DELETE') { exigirRol($usuario, ROLES_AVANCE); $incidencia->eliminar($iid); }
        else { responder(405, ['error' => 'Metodo no permitido']); }
        exit;
    }

    // /proyectos/material/{idAsignacion}[/consumos]  (RF10/RF12)
    if ($id === 'material') {
        $idAsig = $segmentos[2] ?? null;
        if ($idAsig === null) { responder(404, ['error' => 'Falta el id de asignación']); exit; }
        if (($segmentos[3] ?? null) === 'consumos') {
            switch ($metodoHttp) {
                case 'GET':  $materialObra->listarConsumos($idAsig); break;
                case 'POST': exigirRol($usuario, ROLES_AVANCE); $materialObra->crearConsumo($idAsig, leerCuerpoJson()); break;
                default:     responder(405, ['error' => 'Metodo no permitido']);
            }
            exit;
        }
        if ($metodoHttp === 'DELETE') { exigirRol($usuario, ROLES_GESTION_OBRA); $materialObra->eliminarAsignacion($idAsig); }
        else { responder(405, ['error' => 'Metodo no permitido']); }
        exit;
    }

    // /proyectos/consumo/{id}  -> DELETE de un consumo de material
    if ($id === 'consumo') {
        $idc = $segmentos[2] ?? null;
        if ($idc === null) { responder(404, ['error' => 'Falta el id de consumo']); exit; }
        if ($metodoHttp === 'DELETE') { exigirRol($usuario, ROLES_AVANCE); $materialObra->eliminarConsumo($idc); }
        else { responder(405, ['error' => 'Metodo no permitido']); }
        exit;
    }

    // /proyectos/documento/{id}  -> DELETE de un documento
    if ($id === 'documento') {
        $idd = $segmentos[2] ?? null;
        if ($idd === null) { responder(404, ['error' => 'Falta el id de documento']); exit; }
        if ($metodoHttp === 'DELETE') { exigirRol($usuario, ROLES_DOC); $documento->eliminar($idd); }
        else { responder(405, ['error' => 'Metodo no permitido']); }
        exit;
    }

    // /proyectos/inactividad/{id}  -> DELETE de un periodo de inactividad
    if ($id === 'inactividad') {
        $idp = $segmentos[2] ?? null;
        if ($idp === null) { responder(404, ['error' => 'Falta el id de período']); exit; }
        if ($metodoHttp === 'DELETE') { exigirRol($usuario, ROLES_DOC); $inactividad->eliminar($idp); }
        else { responder(405, ['error' => 'Metodo no permitido']); }
        exit;
    }

    // /proyectos/excedente/{id}  -> DELETE de un item excedente
    if ($id === 'excedente') {
        $idx = $segmentos[2] ?? null;
        if ($idx === null) { responder(404, ['error' => 'Falta el id de ítem']); exit; }
        if ($metodoHttp === 'DELETE') { exigirRol($usuario, ROLES_DOC); $itemExcedente->eliminar($idx); }
        else { responder(405, ['error' => 'Metodo no permitido']); }
        exit;
    }

    // Sub-recurso: /proyectos/{id}/asistencias  (RF06)
    if (($segmentos[2] ?? null) === 'asistencias') {
        switch ($metodoHttp) {
            case 'GET':  $asistencia->listarPorProyecto($id); break;
            case 'POST': exigirRol($usuario, ROLES_AVANCE); $asistencia->crear($id, leerCuerpoJson()); break;
            default:     responder(405, ['error' => 'Metodo no permitido']);
        }
        exit;
    }

    // Sub-recurso: /proyectos/{id}/incidencias  (RF09)
    if (($segmentos[2] ?? null) === 'incidencias') {
        switch ($metodoHttp) {
            case 'GET':  $incidencia->listarPorProyecto($id); break;
            case 'POST': exigirRol($usuario, ROLES_AVANCE); $incidencia->crear($id, leerCuerpoJson()); break;
            default:     responder(405, ['error' => 'Metodo no permitido']);
        }
        exit;
    }

    // Sub-recurso: /proyectos/{id}/materiales  (RF10/RF12)
    if (($segmentos[2] ?? null) === 'materiales') {
        switch ($metodoHttp) {
            case 'GET':  $materialObra->listarPorProyecto($id); break;
            case 'POST': exigirRol($usuario, ROLES_GESTION_OBRA); $materialObra->asignar($id, leerCuerpoJson()); break;
            default:     responder(405, ['error' => 'Metodo no permitido']);
        }
        exit;
    }

    // Sub-recurso: /proyectos/{id}/documentos  (RF16)
    if (($segmentos[2] ?? null) === 'documentos') {
        switch ($metodoHttp) {
            case 'GET':  $documento->listarPorProyecto($id); break;
            case 'POST': exigirRol($usuario, ROLES_DOC); $documento->crear($id, leerCuerpoJson()); break;
            default:     responder(405, ['error' => 'Metodo no permitido']);
        }
        exit;
    }

    // Sub-recurso: /proyectos/{id}/inactividades  (RF25)
    if (($segmentos[2] ?? null) === 'inactividades') {
        switch ($metodoHttp) {
            case 'GET':  $inactividad->listarPorProyecto($id); break;
            case 'POST': exigirRol($usuario, ROLES_DOC); $inactividad->crear($id, leerCuerpoJson()); break;
            default:     responder(405, ['error' => 'Metodo no permitido']);
        }
        exit;
    }

    // Sub-recurso: /proyectos/{id}/excedentes  (RF22)
    if (($segmentos[2] ?? null) === 'excedentes') {
        switch ($metodoHttp) {
            case 'GET':  $itemExcedente->listarPorProyecto($id); break;
            case 'POST': exigirRol($usuario, ROLES_DOC); $itemExcedente->crear($id, leerCuerpoJson()); break;
            default:     responder(405, ['error' => 'Metodo no permitido']);
        }
        exit;
    }

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
