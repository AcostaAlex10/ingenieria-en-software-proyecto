<?php

declare(strict_types=1);

/**
 * Analisis y alertas (RF11/RF13). No tiene tablas propias: calcula
 * indicadores a partir de los datos existentes (proyectos, planificacion,
 * avances y materiales).
 *
 *  - RF11: alerta cuando el avance real es menor al esperado planificado.
 *  - RF13: diferencia entre el presupuesto y el gasto ejecutado estimado
 *          (presupuesto x % de avance).
 *  - (bonus RF12) alerta cuando un material supera la cantidad asignada.
 *
 * RF20: al Personal Tecnico se le ocultan los importes (presupuesto, gasto
 * ejecutado y diferencia).
 */
final class AnalisisController
{
    public function __construct(private PDO $db)
    {
    }

    /** GET /api/analisis */
    public function resumen(?string $rol = null): void
    {
        $ocultarCostos = $rol === 'PersonalTecnico';

        // Proyectos con su planificacion (incluye id_planificacion para calcular etapas).
        $stmt = $this->db->query(
            'SELECT p.id_proyecto, p.nombre, p.estado, p.avance, p.presupuesto,
                    pl.id_planificacion, pl.avance_esperado_total
             FROM proyecto p
             LEFT JOIN planificacion pl ON pl.id_proyecto = p.id_proyecto
             ORDER BY p.nombre'
        );
        $filas = $stmt->fetchAll();

        // Calcular esperado por etapas en una sola query (batch).
        $planIds   = [];
        $fallbacks = [];
        foreach ($filas as $f) {
            if ($f['id_planificacion'] !== null) {
                $pid = (int) $f['id_planificacion'];
                $planIds[]        = $pid;
                $fallbacks[$pid]  = (float) $f['avance_esperado_total'];
            }
        }
        $esperadosPorPlan = EtapaPlanificacionController::calcularEsperadoBatch($this->db, $planIds, $fallbacks);

        // Presupuesto base total por proyecto (suma de etapas). Solo para no-Tecnico (RF20).
        $presupuestoBasePorProyecto = [];
        if (!$ocultarCostos && !empty($planIds)) {
            $placeholders = implode(',', array_fill(0, count($planIds), '?'));
            $stmtPB = $this->db->prepare(
                "SELECT pl.id_proyecto, COALESCE(SUM(ep.presupuesto_base), 0) AS presupuesto_base_total
                 FROM planificacion pl
                 JOIN etapa_planificacion ep ON ep.id_planificacion = pl.id_planificacion
                 WHERE pl.id_planificacion IN ($placeholders)
                 GROUP BY pl.id_proyecto"
            );
            $stmtPB->execute(array_values($planIds));
            foreach ($stmtPB->fetchAll() as $row) {
                $presupuestoBasePorProyecto[(int) $row['id_proyecto']] = (float) $row['presupuesto_base_total'];
            }
        }

        // Materiales excedidos por proyecto (RF12).
        $excedidos = $this->materialesExcedidosPorProyecto();

        $proyectos = [];
        $alertas = [];
        foreach ($filas as $f) {
            $idP = (int) $f['id_proyecto'];
            $avanceReal = (float) $f['avance'];
            $esperado = $f['id_planificacion'] !== null
                ? ($esperadosPorPlan[(int) $f['id_planificacion']] ?? null)
                : null;
            $alertaAvance = $esperado !== null && $avanceReal < $esperado;
            $matExc = $excedidos[$idP] ?? 0;

            $item = [
                'id_proyecto' => $idP,
                'nombre' => $f['nombre'],
                'estado' => $f['estado'],
                'avance_real' => $avanceReal,
                'avance_esperado' => $esperado,
                'desvio_avance' => $esperado !== null ? round($avanceReal - $esperado, 2) : null,
                'alerta_avance' => $alertaAvance,
                'materiales_excedidos' => $matExc,
            ];

            if (!$ocultarCostos) {
                $presupuesto = (float) $f['presupuesto'];
                $ejecutado = round($presupuesto * $avanceReal / 100, 2);
                $item['presupuesto'] = $presupuesto;
                $item['ejecutado']   = $ejecutado;   // RF13 (estimado por avance)
                $item['diferencia']  = round($presupuesto - $ejecutado, 2);
                // Presupuesto base planificado (suma de etapas). null si el proyecto no tiene etapas.
                $pbTotal = $presupuestoBasePorProyecto[$idP] ?? null;
                $item['presupuesto_base_total'] = $pbTotal;
            }

            $proyectos[] = $item;

            // Feed de alertas
            if ($alertaAvance) {
                $alertas[] = [
                    'tipo' => 'avance',
                    'gravedad' => ($esperado - $avanceReal) >= 15 ? 'alta' : 'media',
                    'proyecto' => $f['nombre'],
                    'mensaje' => 'El avance real (' . $avanceReal . '%) está por debajo del esperado (' . $esperado . '%).',
                ];
            }
            if ($matExc > 0) {
                $alertas[] = [
                    'tipo' => 'material',
                    'gravedad' => 'media',
                    'proyecto' => $f['nombre'],
                    'mensaje' => $matExc . ' material(es) superan la cantidad asignada.',
                ];
            }
        }

        $this->json(200, ['proyectos' => $proyectos, 'alertas' => $alertas]);
    }

    /**
     * Cuenta, por proyecto, cuantos materiales tienen consumo mayor a lo
     * asignado (RF12).
     * @return array<int,int>  id_proyecto => cantidad de materiales excedidos
     */
    private function materialesExcedidosPorProyecto(): array
    {
        $stmt = $this->db->query(
            'SELECT id_proyecto, COUNT(*) AS excedidos FROM (
                SELECT am.id_proyecto AS id_proyecto, am.id_asignacion,
                       am.cantidad_asignada,
                       COALESCE(SUM(cm.cantidad_consumida), 0) AS consumido
                FROM asignacion_material am
                LEFT JOIN consumo_material cm ON cm.id_asignacion = am.id_asignacion
                GROUP BY am.id_asignacion, am.id_proyecto, am.cantidad_asignada
            ) t
            WHERE t.consumido > t.cantidad_asignada
            GROUP BY id_proyecto'
        );
        $mapa = [];
        foreach ($stmt->fetchAll() as $f) {
            $mapa[(int) $f['id_proyecto']] = (int) $f['excedidos'];
        }
        return $mapa;
    }

    private function json(int $codigo, mixed $cuerpo): void
    {
        http_response_code($codigo);
        echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
    }
}
