# SGSO — Documentación del proyecto

Documento de contexto: consolida lo definido en los trabajos prácticos de la
cátedra con lo que efectivamente está implementado en el repositorio. Para
instalar y ejecutar el sistema, ver [README.md](README.md).

---

## 1. Contexto académico

| | |
|---|---|
| Asignatura | IC-413 — Ingeniería del Software I |
| Institución | Universidad Nacional de Misiones, Facultad de Ingeniería |
| Ciclo lectivo | 2026 |
| Grupo | Grupo 2 — Acosta, Alex Nahuel; Bareiro, Santiago Daniel; Molina, Juan Carlos; Paulus, Octavio Elías |
| Docentes | Ing. Roberto Suenaga; Dra. Nancy B. Ganz; Mg. Briant Gauna |
| Nombre del producto | TriweProjectManagement — SGSO |

### Trabajos prácticos entregados

| TP | Contenido |
|---|---|
| TP2 | Descripción del sistema, módulos y sus relaciones, alcance y limitaciones, tipos de usuario, diagrama de contexto, requerimientos funcionales e historias de usuario |
| TP3 | Diagramas de secuencia (CU1 Registrar Proyecto, CU22 Registrar Consumo de Materiales), diagramas de transición de estados (proyecto y reporte), diagrama de clases, modelo de datos relacional, backlog y prototipo de interfaz |
| TP4 | Desarrollo de un componente del software: sprint de una semana bajo Scrum, implementación de Autenticación, Gestión de Proyectos y Seguimiento, despliegue en la nube y criterios de aceptación |

---

## 2. Problema y objetivo

La empresa constructora gestiona sus obras con planillas de Excel y archivos en
Google Drive. De ahí se derivan los problemas que el sistema busca resolver:

- No hay control del presupuesto contra el avance real de la obra.
- No hay trazabilidad de materiales ni registro de consumos.
- Los datos están dispersos, con versiones desactualizadas y pérdida de información.
- La comunicación entre la obra y la oficina central es deficiente, lo que genera
  retrabajos y pérdidas económicas.

El objetivo es centralizar la información operativa de las obras en un sistema
único, con control presupuestario, trazabilidad y alertas de desvío.

---

## 3. Alcance

**Dentro del alcance:** gestión de proyectos, planificación, seguimiento operativo
diario, materiales, documentación, reportes con aprobación, análisis y alertas,
gestión de maquinaria, y control de acceso por roles.

**Fuera del alcance** (definido en el TP2):

- Integración con ERP o software contable. El sistema no es un software de
  contabilidad, sino una herramienta de gestión y seguimiento operativo.
- Funcionamiento completamente offline, por la complejidad de sincronizar datos
  de forma segura.
- Funcionalidades de inteligencia artificial o análisis predictivo (predicción de
  retrasos, sobrecostos o fallas).

---

## 4. Actores

| Actor | Responsabilidad | Contexto de uso |
|---|---|---|
| Personal Administrativo | Registra y administra obras, presupuestos, contratos y materiales; valida avances y aprueba reportes | Oficina, navegador de escritorio |
| Personal Técnico (encargado de obra) | Registra avance físico, asistencia, consumo de materiales, uso de maquinaria e incidencias | En obra, dispositivo móvil o tablet |
| Gerente | Consulta indicadores, comparativas y reportes para decisiones estratégicas | Escritorio o móvil |
| Administrador del Sistema | Administra cuentas de usuario y asignación de roles | Escritorio |

---

## 5. Módulos funcionales

| Módulo | Responsabilidades |
|---|---|
| Gestión de Proyectos | Registrar, modificar y eliminar obras; organizar la información por obra; almacenar la planificación inicial |
| Seguimiento Operativo | Avance físico, asistencia, incidencias, períodos de inactividad, eventos externos e ítems excedentes |
| Gestión de Materiales | Asignar materiales a obras, registrar consumos y consultar lo utilizado |
| Documentación | Almacenar y consultar PDF e imágenes asociados a cada obra |
| Reportes y Control | Crear, revisar, editar y aprobar reportes operativos |
| Análisis y Alertas | Desviaciones entre presupuesto y avance, alertas de desvío y sobrecosto, informes comparativos |
| Gestión de Maquinaria | Uso de equipos, historial de fallas y reemplazos, rendimiento |

Los requerimientos funcionales (RF01 a RF28) y las historias de usuario están
enumerados en la presentación del proyecto y en el TP2; este documento no los
duplica para evitar que las dos fuentes se desincronicen.

---

## 6. Arquitectura

Arquitectura definida en el TP3 y confirmada en el TP4:

- **SPA React** para Personal Administrativo y Gerencia, en navegador de escritorio.
- **Interfaz responsive (PWA)** para el Personal Técnico en obra.
- **API REST** que concentra la lógica de negocio, la autenticación y la
  autorización por roles.
- **Base de datos relacional** MariaDB / MySQL.

### Stack implementado

| Capa | Tecnología |
|---|---|
| Frontend | React 18, React Router v7, Vite 6, TypeScript, Tailwind CSS v4, shadcn/ui, Recharts, Leaflet |
| Backend | PHP 8 sin framework, acceso a datos por PDO |
| Base de datos | MariaDB / MySQL |
| Seguridad | bcrypt para el hash de contraseñas, JWT para la sesión |
| Contenedores | Docker, para empaquetar PHP + Apache |

### Despliegue

| Componente | Servicio | Notas |
|---|---|---|
| Frontend | Vercel | Publica la SPA con una URL pública |
| Backend | Render (Docker) | Ejecuta el contenedor PHP + Apache; el plan gratuito suspende el servicio tras unos minutos sin uso |
| Base de datos | Aiven | MariaDB / MySQL persistente, con SSL (`DB_SSL=true`) |

Se eligió desplegar en la nube porque el equipo trabaja de forma distribuida y el
sistema debía quedar accesible para las demostraciones sin depender de la
computadora de un integrante.

### Decisión técnica: PHP como backend

La cátedra exige PHP sobre MariaDB. Durante el desarrollo distintos integrantes
prototiparon módulos por separado y llegó a existir una implementación en
Node.js + Express + TypeScript, que sigue en el repositorio bajo `back-node/`.
Para la entrega se unificó todo en el backend PHP de `back/`, que es el que está
desplegado. `back-node/` se conserva como referencia, no se despliega y no debe
usarse para nuevas funcionalidades.

---

## 7. Modelo de datos

Diecisiete tablas, definidas en `back/sql/schema.sql`:

| Grupo | Tablas |
|---|---|
| Acceso | `usuario` (con `rol`, `activo`, hash bcrypt y token de recuperación) |
| Obra | `proyecto`, `planificacion`, `etapa_planificacion`, `avance_fisico` |
| Seguimiento | `asistencia`, `incidencia`, `periodo_inactividad`, `item_excedente` |
| Materiales | `material`, `asignacion_material`, `consumo_material` |
| Maquinaria | `maquinaria`, `registro_maquinaria`, `falla_maquinaria` |
| Documentación | `documento`, `reporte` |

La entidad central es `proyecto`: de ella cuelgan la planificación (con sus etapas
y avances), la asistencia, las incidencias, los materiales asignados, la
documentación, los reportes y los períodos de inactividad.

### Estados

- **Proyecto** (`proyecto.estado`, valor inicial `planificacion`):
  `planificacion` → `en_ejecucion` ⇄ `pausada` → `finalizada`.
- **Reporte** (`reporte.estado`, valor inicial `borrador`):
  `borrador` → `en_revision` → `aprobado`, o `rechazado` y vuelta a `borrador`.
- **Asistencia**: `presente` | `ausente` | `tarde`.
- **Incidencia**: tipo `clima` | `falla_maquinaria` | `proveedor` | `otro`;
  gravedad `baja` | `media` | `alta`.

---

## 8. Trazabilidad

### Historias de usuario del sprint del TP4

| HU | Funcionalidad | RF asociados | Estado |
|---|---|---|---|
| HU16 | Autenticación y control de acceso: login, roles base, sesión | RF19, RF20 (parcial) | Implementado |
| HU01 | Gestión de Proyectos: registrar, modificar, eliminar, organizar por obra | RF01, RF02, RF03 | Implementado |
| HU02 | Planificación inicial de la obra (avance esperado) | RF05, RF11, RF14 | Implementado |
| HU04 | Registro de avance físico y comparación esperado contra real | RF14 | Implementado |
| HU12, HU13 | Dashboard de indicadores | RF05, RF06 | Implementado |

### Módulo → código

| Módulo | Frontend | Backend |
|---|---|---|
| Autenticación | `LoginPage`, `OlvidePage`, `RestablecerPage` | `AuthController`, `AuthMiddleware`, `Jwt`, `Mailer` |
| Gestión de Proyectos | `ProyectosPage`, `ProyectoDetallePage`, `MapaProyectos` | `ProyectoController`, `MySqlProyectoRepository`, `Geocoder` |
| Planificación y avance | `SeguimientoPage` | `PlanificacionController`, `EtapaPlanificacionController`, `AvanceController` |
| Seguimiento operativo | `SeguimientoPage` | `AsistenciaController`, `IncidenciaController`, `InactividadController`, `ItemExcedenteController` |
| Materiales | `MaterialesPage` | `MaterialController`, `MaterialObraController` |
| Maquinaria | `MaquinariaPage` | `MaquinariaController` |
| Documentación | `DocumentacionPage` | `DocumentoController` |
| Reportes | `ReportesPage` | `ReporteController` |
| Análisis y alertas | `AlertasPage`, `Dashboard`, `ChartsPanel` | `AnalisisController` |
| Administración de usuarios | `UsuariosPage` | `UsuarioController` |

### Rutas del frontend

`/login`, `/olvide`, `/restablecer` son públicas. El resto cuelga del layout
`Root` y exige sesión: `/` (Dashboard), `/proyectos`, `/proyectos/:id`,
`/seguimiento`, `/materiales`, `/documentacion`, `/reportes`, `/alertas`,
`/maquinaria`, `/usuarios`.

---

## 9. Estado del sistema

Todos los módulos tienen interfaz y endpoints implementados y persisten contra la
base de datos. El sprint del TP4 cubrió formalmente Autenticación, Gestión de
Proyectos y Seguimiento; los módulos restantes se incorporaron en sprints
posteriores y están operativos, aunque no fueron documentados con criterios de
aceptación formales.

### Pendientes y deuda técnica

1. **No hay pruebas automatizadas.** Ni en el frontend ni en el backend hay tests
   ni scripts de lint. La verificación fue manual, de extremo a extremo, sobre el
   entorno desplegado.
2. **Backend duplicado.** `back-node/` reimplementa el backend en Node. Mientras
   siga en el repositorio hay riesgo de que alguien modifique el backend
   equivocado o de que ambos se desincronicen.
3. **Migraciones duplicadas.** `back/sql/schema.sql` y `back-node/migrations/`
   describen el mismo modelo por separado; solo el primero es el vigente.
4. **Normalización pendiente.** `proyecto.encargado` es texto libre en lugar de una
   referencia a `usuario`, y `proyecto.avance` se guarda como campo plano en vez de
   calcularse a partir de `avance_fisico`, como preveía el diagrama de clases del TP3.
5. **Documentación por módulo.** Los módulos agregados después del TP4 no tienen
   criterios de aceptación escritos.

---

## 10. Convenciones del código

- El frontend usa el alias `@` para `FRONT/src`. Las páginas viven directamente en
  `src/app/components/` y los primitivos de shadcn/ui en `src/app/components/ui/`.
- El tema activo es oscuro con acento naranja (`--primary: #e8981e`), definido en
  `src/styles/theme.css`. `default_shadcn_theme.css` se conserva como referencia
  del tema claro, sin aplicar.
- El backend PHP resuelve todo por un front controller (`back/public/index.php`)
  que parsea la ruta, valida el token y delega en el controlador correspondiente.
  La autorización se expresa con grupos de roles constantes declarados en ese
  mismo archivo.
- La zona horaria del backend se fija en `America/Argentina/Buenos_Aires`, porque
  el servidor de Render corre en UTC y las validaciones de fecha dependen de la
  fecha local.
- `back/src/Cors.php` valida el `Origin` recibido contra una lista blanca antes de
  reflejarlo; si no figura, no se envía `Access-Control-Allow-Origin` y el navegador
  bloquea la respuesta. La lista combina los orígenes por defecto del archivo
  (producción, previews de Vercel por rama y `localhost`) con lo que se agregue en
  la variable `CORS_ORIGIN`, separando varios valores por coma. Acepta comodines
  (`https://*-acostaalex10.vercel.app`) para los dominios que Vercel genera por rama.
