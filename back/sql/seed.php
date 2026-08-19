<?php

declare(strict_types=1);

/**
 * Seed: crea el usuario administrador de prueba (con contrasena hasheada)
 * y carga los proyectos de ejemplo en MariaDB si la tabla esta vacia.
 *
 * Uso (desde la carpeta back):  php sql/seed.php
 */
require_once __DIR__ . '/../src/Env.php';
require_once __DIR__ . '/../src/Database.php';

Env::cargar(__DIR__ . '/../.env');

$db = Database::conexion();

// --- Usuario administrador ---
$email = 'admin@sgso.com';
$hash = password_hash('admin123', PASSWORD_BCRYPT);

$stmt = $db->prepare(
    'INSERT INTO usuario (nombre, email, contrasena, rol, activo)
     VALUES (?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE contrasena = VALUES(contrasena), activo = 1'
);
$stmt->execute(['Admin Sistema', $email, $hash, 'AdministradorSistema']);
echo "Admin listo: {$email} / admin123\n";

// --- Proyectos de ejemplo (solo si la tabla esta vacia) ---
$total = (int) $db->query('SELECT COUNT(*) FROM proyecto')->fetchColumn();
if ($total === 0) {
    $semilla = json_decode((string) file_get_contents(__DIR__ . '/../data/proyectos.seed.json'), true) ?: [];
    $stmt = $db->prepare(
        'INSERT INTO proyecto (nombre, tipo, ubicacion, encargado, fecha_inicio, estado, avance, presupuesto)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    foreach ($semilla as $p) {
        $stmt->execute([
            $p['nombre'], $p['tipo'], $p['ubicacion'], $p['encargado'],
            $p['fechaInicio'], $p['estado'] ?? 'planificacion',
            (float) ($p['avance'] ?? 0), (float) $p['presupuesto'],
        ]);
    }
    echo 'Proyectos de ejemplo cargados: ' . count($semilla) . "\n";
} else {
    echo "Proyectos: ya habia datos ({$total}), no se toca.\n";
}
