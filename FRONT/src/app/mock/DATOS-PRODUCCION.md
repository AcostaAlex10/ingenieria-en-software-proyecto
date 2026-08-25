# Datos de la base de produccion (SGSO)

Extraido de la base Aiven (`defaultdb`) el 2026-08-25. Sirve de insumo para armar el `datos.json` del modo de prueba estatico (`FRONT/src/app/mock/`).

> **No incluye credenciales.** Se omiten los hashes de contrasena y los tokens de sesion y de recuperacion; los correos personales van enmascarados. El mock valida el login comparando texto plano, asi que las contrasenas de prueba se definen aparte y no salen de aca.

## Inventario

| Tabla | Coleccion en el mock | Filas reales | Filas del mock ficticio |
|---|---|---:|---:|
| `usuario` | `usuarios` | 3 | 5 |
| `proyecto` | `proyectos` | 4 | 6 |
| `planificacion` | `planificaciones` | 4 | 5 |
| `etapa_planificacion` | `etapas` | 2 | 8 |
| `avance_fisico` | `avances` | 9 | 10 |
| `asistencia` | `asistencias` | **0** | 5 |
| `incidencia` | `incidencias` | **0** | 4 |
| `material` | `materiales` | 10 | 10 |
| `asignacion_material` | `asignaciones` | 1 | 6 |
| `consumo_material` | `consumos` | 1 | 6 |
| `documento` | `documentos` | **0** | 4 |
| `reporte` | `reportes` | 1 | 4 |
| `periodo_inactividad` | `inactividades` | **0** | 2 |
| `item_excedente` | `excedentes` | **0** | 2 |
| `maquinaria` | `maquinaria` | 4 | 4 |
| `registro_maquinaria` | `registros_maquinaria` | 3 | 5 |
| `falla_maquinaria` | `fallas_maquinaria` | 1 | 3 |

Hay **5 tablas sin datos**: `asistencia`, `incidencia`, `documento`, `periodo_inactividad`, `item_excedente`. Las pantallas que dependen de ellas (Seguimiento, Documentacion, y las secciones de inactividad y excedentes del detalle de obra) quedarian vacias si se usan solo estos datos.

---

## `usuario` — Cuentas y roles

| `rol` | `email` | `activo` | `nombre` | `id_usuario` | `fecha_creacion` |
|---|---|---|---|---|---|
| AdministradorSistema | admin@sgso.com | 1 | Admin Sistema | 1 | 2026-06-20 00:25:04.000000 |
| AdministradorSistema | al***@gmail.com | 1 | Alex Acosta | 2 | 2026-06-20 04:31:31.000000 |
| PersonalTecnico | tecnico@sgso.com | 1 | Tomas Tecnico | 3 | 2026-06-22 22:32:11.000000 |

## `proyecto` — Obras

| `tipo` | `avance` | `estado` | `nombre` | `encargado` | `ubicacion` | `id_proyecto` | `presupuesto` | `fecha_inicio` |
|---|---|---|---|---|---|---|---|---|
| Infraestructura Vial | 65.0 | en_ejecucion | Obra Vial Ruta 14 | Ing. Roberto Suénaga | Posadas, Misiones | 1 | 15000000.0 | 2026-01-15 |
| Construcción Edilicia | 45.0 | en_ejecucion | Edificio Residencial Los Pinos | Arq. Nancy Ganz | Oberá, Misiones | 2 | 8500000.0 | 2025-11-20 |
| Infraestructura Vial | 100.0 | finalizada | Puente Posadas-Encarnación | Ing. Briant perez | Posadas, Misiones | 3 | 250000.0 | 2026-07-30 |
| Infraestructura Vial | 0.0 | planificacion | Obra 2 | Ing Bareiro Santiago | Obera, Misiones | 30 | 100000.0 | 2026-07-07 |

## `planificacion` — Planificacion por obra

| `fecha_carga` | `id_proyecto` | `id_planificacion` | `avance_esperado_total` |
|---|---|---|---|
| 2026-06-20 | 3 | 2 | 1.0 |
| 2026-06-20 | 2 | 3 | 0.02 |
| 2026-06-20 | 1 | 4 | 4.0 |
| 2026-06-29 | 30 | 14 | 0.0 |

## `etapa_planificacion` — Etapas del cronograma

| `orden` | `nombre` | `id_etapa` | `fecha_fin` | `fecha_inicio` | `peso_porcentual` | `id_planificacion` | `presupuesto_base` |
|---|---|---|---|---|---|---|---|
| 0 | 2do piso | 1 | 2026-07-09 | 2026-06-29 | 15.0 | 3 | 250000.0 |
| 0 | Cimientos | 4 | 2026-07-10 | 2026-06-29 | 2.0 | 14 | 100.0 |

## `avance_fisico` — Avance fisico registrado

| `fecha` | `id_avance` | `observaciones` | `id_planificacion` | `porcentaje_avance` | `cantidad_ejecutada` |
|---|---|---|---|---|---|
| 2026-06-20 | 4 | — | 2 | 22.0 | 22.0 |
| 2026-06-20 | 5 | — | 2 | 99.0 | 99.0 |
| 2026-06-20 | 6 | — | 2 | 22.0 | 22.0 |
| 2026-06-20 | 7 | — | 2 | 1.0 | 1.0 |
| 2026-06-20 | 8 | — | 2 | 1.0 | 1.0 |
| 2026-06-20 | 9 | — | 2 | 3.0 | 3.0 |
| 2026-06-27 | 20 | — | 2 | 1.0 | 88.0 |
| 2026-06-27 | 21 | — | 2 | 100.0 | 33.0 |
| 2026-07-01 | 29 | — | 14 | 40.0 | 2.0 |

## `asistencia` — Asistencia del personal

_Sin registros._

## `incidencia` — Incidencias externas

_Sin registros._

## `material` — Catalogo de materiales

| `nombre` | `unidad` | `id_material` |
|---|---|---|
| Cemento | bolsa | 1 |
| Arena | m3 | 2 |
| Piedra triturada | m3 | 3 |
| Hierro del 8 | kg | 4 |
| Hierro del 10 | kg | 5 |
| Ladrillo comun | unidad | 6 |
| Cal | bolsa | 7 |
| Hormigon elaborado | m3 | 8 |
| Madera (encofrado) | m2 | 9 |
| Pintura latex | litro | 10 |

## `asignacion_material` — Material asignado a obra

| `id_material` | `id_proyecto` | `id_asignacion` | `cantidad_asignada` |
|---|---|---|---|
| 2 | 30 | 5 | 3.0 |

## `consumo_material` — Consumos registrados

| `fecha` | `id_consumo` | `id_asignacion` | `observaciones` | `cantidad_consumida` |
|---|---|---|---|---|
| 2026-06-29 | 6 | 5 | — | 1.0 |

## `documento` — Documentacion por obra

_Sin registros._

## `reporte` — Reportes operativos

| `estado` | `titulo` | `contenido` | `id_reporte` | `id_usuario` | `id_proyecto` | `fecha_creacion` | `fecha_revision` | `observacion_revision` |
|---|---|---|---|---|---|---|---|---|
| aprobado | Reporte | Paso | 4 | 2 | 30 | 2026-06-29 11:28:19.000000 | 2026-06-29 11:28:42.000000 | — |

## `periodo_inactividad` — Periodos de inactividad

_Sin registros._

## `item_excedente` — Items excedentes

_Sin registros._

## `maquinaria` — Equipos

| `tipo` | `activa` | `nombre` | `id_maquinaria` |
|---|---|---|---|
| Excavación | 1 | Retroexcavadora CAT 320 | 1 |
| Carga | 1 | Cargadora frontal JCB | 2 |
| Transporte | 1 | Camión volcador Iveco | 3 |
| Nivelación | 1 | Motoniveladora John Deere | 4 |

## `registro_maquinaria` — Uso de maquinaria

| `fecha` | `operario` | `horas_uso` | `id_proyecto` | `id_registro` | `id_maquinaria` | `produccion_realizada` | `combustible_consumido` |
|---|---|---|---|---|---|---|---|
| 2026-06-20 | Carlos Gomez | 8.0 | — | 1 | 1 | 120.0 | 40.0 |
| 2026-06-21 | Luis Diaz | 6.0 | — | 2 | 1 | 90.0 | 30.0 |
| 2026-06-22 | Carlos Gomez | 4.0 | — | 3 | 1 | 50.0 | 60.0 |

## `falla_maquinaria` — Fallas de maquinaria

| `fecha` | `id_falla` | `resuelto` | `reemplazo` | `componente` | `descripcion` | `id_maquinaria` |
|---|---|---|---|---|---|---|
| 2026-06-22 | 1 | 0 | 1 | Bomba hidraulica | Perdida de presion en el sistema | 1 |
