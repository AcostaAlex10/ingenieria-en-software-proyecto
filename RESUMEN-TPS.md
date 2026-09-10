# Resumen de los cuatro trabajos prácticos

Qué dice cada TP, y en qué quedó cada cosa una vez construido el sistema. Sirve
para retomar el proyecto sin tener que abrir los cuatro PDF, y para saber dónde
el documento y el código dejaron de coincidir.

Los PDF están en la raíz del repositorio. Este resumen se escribió contrastando
su contenido contra el código, no contra el entorno desplegado.

| Documento | Para qué |
|---|---|
| `RESUMEN-TPS.md` | este: qué dice cada TP y en qué quedó |
| `REVISION-TPS.md` | las correcciones del docente y las divergencias, en detalle |
| `DOCUMENTACION.md` | el sistema como está hoy: modelo de datos, arquitectura, trazabilidad |
| `GUIA-TESTERS.md` | la tabla completa de los 28 RF y cómo probar el sistema |

**Equipo:** Acosta (Alex Nahuel), Bareiro (Santiago Daniel), Molina (Juan Carlos),
Paulus (Octavio Elías). Cátedra IC-413, Ingeniería del Software I, UNaM, 2026.
Docentes: Ing. Roberto Suénaga, Dra. Nancy B. Ganz, Mg. Briant Gauna.

---

## TP1 — Elicitación

Define el caso de estudio: una empresa constructora que pierde plata por falta de
control en la compra de materiales, dependencia de proveedores habituales sin
comparar precios, y dificultad para seguir el presupuesto contra el avance real.

**Clasificación del sistema.** Hecho a medida. No socio-crítico, pero sí crítico
para el negocio: si el cálculo de desvío falla, la empresa pierde dinero.
Aplicación interactiva basada en transacciones. Sistema de información y soporte
a la decisión. Producto de uso interno. Atributos de calidad principales:
confiabilidad y eficiencia.

**Usuarios.** Personal Administrativo (carga requerimientos de materiales),
Personal Técnico (alimenta avance físico, horas, consumo), Gerencia y Directivos
(reciben y analizan las alertas de desvío).

**Elicitación.** Dos encuentros con Tanya Kraus, directora técnica. El segundo
con plan de entrevista y estructura de embudo. Lo que sale de ahí y explica el
sistema: hoy trabajan con Excel y Drive, sin protocolo definido; la comunicación
entre obra y oficina falla por diferencia de ritmos; hubo pérdidas concretas por
horas de maquinista mal cargadas y por compras hechas fuera de protocolo, que le
costaron a la empresa retenciones impositivas y una posible multa.

**Roles del equipo.** Bareiro: analista de requerimientos. Acosta: arquitecto y
diseñador. Molina: desarrollador principal. Paulus: líder de proyecto y tester.

### Lo que el TP1 propone y el sistema no tiene

El TP1 plantea **dos** funcionalidades principales. Solo se construyó una.

La que sí: el algoritmo de control presupuestario, que compara gasto contra
avance físico y emite alertas. Es el corazón de lo implementado (RF11, RF13).

La que no: **la gestión de compras con comparación de proveedores.** El TP1 la
describe como generar automáticamente opciones de proveedores para comparar
precios, disponibilidad y condiciones, y hasta enviar pedidos de presupuesto. No
existe en el sistema: no hay tabla `proveedor` ni nada que compare precios. La
única aparición de la palabra es `incidencia.tipo = 'proveedor'`, que registra un
retraso, no una cotización.

El recorte no es un descuido de la implementación: ya el TP2 dejó fuera esa
funcionalidad al enumerar los requerimientos, y ningún RF del RF01 al RF28 habla
de comparar proveedores. Conviene tenerlo presente porque es la diferencia entre
lo que el TP1 le prometió al cliente y lo que el sistema hace.

---

## TP2 — Especificación

Descripción del sistema, módulos y relaciones, alcance y limitaciones, tipos de
usuario, diagrama de contexto, **los 28 requerimientos funcionales** y las
historias de usuario.

La tabla completa de los RF, con su prioridad, está transcrita en
`GUIA-TESTERS.md`. Del reparto: 7 críticos (RF01, RF02, RF03, RF05, RF10, RF19,
RF20), 15 importantes y 6 secundarios.

**Cuatro roles**, que son los que gobiernan la autorización real del backend:
Personal Administrativo, Personal Técnico, Gerente y Administrador del Sistema.

### Correcciones del docente sobre el TP2

| # | Ubicación | Qué marcó | Estado |
|---|---|---|---|
| C1 | pág. 11, diagrama de casos de uso | duplicar los actores para que las líneas no crucen por encima de los CU | pendiente, es edición del PDF |
| C2 | pág. 15, CU22 | revisar el nombre del caso de uso | pendiente, es edición del PDF |
| C3 | pág. 15, CU22 | revisar las pre y poscondiciones | pendiente, es edición del PDF |

La redacción de reemplazo para C2 y C3 ya está propuesta en `REVISION-TPS.md`;
falta trasladarla al documento. Las tres son ediciones sobre el PDF y no se
pueden hacer desde el repositorio.

---

## TP3 — Diseño

Diagramas de secuencia (CU1 Registrar Proyecto, CU22 Registrar Consumo de
Materiales), diagramas de transición de estados de proyecto y de reporte,
diagrama de clases, entidad-relación, modelo relacional, arquitectura por niveles,
prototipo de interfaz y backlog.

**Ciclo de vida del proyecto: siete estados.** `Creado`, `Planificado`,
`EnEjecucion`, `Pausado`, `EnRevision`, `Finalizado`, `Cancelado`. El detalle de
las transiciones y su correspondencia con la base está en `DOCUMENTACION.md`,
sección 7.

**Ciclo de vida del reporte:** `Borrador → EnRevision → Aprobado`, con el rechazo
devolviendo el reporte a `Borrador`.

**Backlog: seis sprints de una semana.**

| Sprint | Módulo | RF asociados |
|---|---|---|
| 1 | Gestión de Proyectos | RF01, RF02, RF03, RF04, RF19 |
| 2 | Seguimiento Operativo | RF05, RF06, RF08, RF09 |
| 3 | Materiales y Documentación | RF07, RF10, RF16 |
| 4 | Reportes, Validación e Inactividad | RF17, RF21, RF22, RF25 |
| 5 | Análisis y Alertas | RF11, RF12, RF13, RF14, RF15 |
| 6 | Maquinaria y Análisis Estratégico | RF18, RF23, RF24, RF27, RF28 |

**Roles Scrum.** Product Owner: Bareiro. Scrum Master: Paulus. Developers:
Acosta (diseño técnico, UML, arquitectura), Molina (implementación), Bareiro
(validación funcional). Seguimiento con GitHub Projects.

### Correcciones del docente sobre el TP3

| # | Ubicación | Qué marcó | Estado |
|---|---|---|---|
| C4 | pág. 3, ciclo de vida del proyecto | «¿De EnRevision no puede pasar a Pausado?» | incorporado en `DOCUMENTACION.md` |
| C5 | pág. 5, ciclo de vida del reporte | faltan estados, puede tener uno cancelado | incorporado en `DOCUMENTACION.md`; falta en el PDF y en el código |

### Lo que el TP3 diseña y el sistema no tiene

- **Servicio de Almacenamiento de Archivos.** El diagrama de contenedores lo
  declara como un contenedor propio, accedido por la API. No existe: `documento`
  guarda una `url`, no el archivo. Es la raíz de la brecha de RF07 y RF16.
- **Aplicación Móvil Responsive (PWA).** El diagrama la lista como contenedor
  separado del SPA. La aplicación es responsive, pero no es una PWA: no hay
  manifiesto ni service worker.
- **`EVENTO_EXTERNO`.** El modelo lo define como entidad propia y el sprint
  backlog le asigna tareas (HU08). No existe como tabla: `incidencia`, con su
  campo `tipo`, absorbió esa función.

---

## TP4 — Construcción

Un sprint de una semana con el objetivo de obtener un incremento entregable:
autenticarse y gestionar obras de punta a punta.

**Alcance comprometido:** HU16 (autenticación y roles), HU01 (gestión de
proyectos), HU02 (planificación inicial), HU04 (avance físico), HU12/HU13
(dashboard), más mejoras de calidad. Todo lo demás, diferido.

**Decisión técnica clave.** Por requerimiento de la cátedra, backend en PHP sobre
MariaDB. Implicó unificar en un solo backend lo que distintos integrantes habían
prototipado por separado. `back-node/` es el resto de esa etapa: no se despliega.

**Stack.** PHP 8.3 sin framework con PDO; MariaDB/MySQL; React 18 + Vite +
TypeScript con Tailwind y shadcn/ui, gráficos con Recharts; bcrypt y JWT. Docker
para empaquetar PHP + Apache.

**Despliegue.** Frontend en Vercel, backend en Render (Docker), base en Aiven.
Todo en capa gratuita.

**Definición de Terminado.** El endpoint responde y persiste; la interfaz lo
consume y refleja el resultado; se validan los casos de error; y se probó de
extremo a extremo sobre el entorno desplegado.

**Después del sprint** el equipo siguió y sumó roles y permisos, seguimiento
operativo, materiales, documentación, reportes con aprobación, inactividad y
excedentes, análisis y alertas, maquinaria, certificación por monto e historial
por estado.

### Lo que el TP4 dice y hoy quedó desactualizado

- **«Resta principalmente la pantalla de gestión de usuarios».** Es la conclusión
  del TP4 y ya no aplica: la pantalla existe y completa RF19.
- **El repositorio que cita** es `Santibareiro27/Ingenieria-en-Software-Proyecto`.
  El trabajo vive en `AcostaAlex10/ingenieria-en-software-proyecto`.
- **La credencial de demostración** figura en la sección 3.b del PDF. Esa cuenta
  fue dada de baja y reemplazada cuando el repositorio pasó a ser público; el
  usuario ya no sirve para entrar. El PDF quedó versionado con ella igual, así
  que no conviene reutilizar ni ese correo ni esa contraseña en ningún lado.
- **RF26 figura como «implementado y verificado»,** junto a RF06, RF08 y RF09. Se
  cumple la primera mitad: `incidencia.gravedad` clasifica en baja, media y alta.
  No la segunda: el requerimiento pide que la gravedad «active diferentes
  protocolos de notificación», y `Mailer` solo se usa para recuperar contraseña.
- **RF07 no aparece** en la tabla de funcionalidades adicionales. Es coherente: no
  está implementado. RF16 sí figura, aclarando «(enlaces)».

---

## Estado consolidado por requerimiento

Lo que quedó después de contrastar los cuatro TP contra el código.

**Cumplidos:** RF01 a RF06, RF08 a RF15, RF16 (con reserva, ver abajo), RF17 a
RF25, RF27 y RF28.

**Incompletos:**

| RF | Prioridad | Qué falta |
|---|---|---|
| RF07 | Importante | adjuntar imágenes y reportes fotográficos: el sistema guarda enlaces, no archivos |
| RF16 | Importante | ídem: «almacenar» documentación en PDF e imágenes se resuelve referenciando una URL externa |
| RF26 | Secundaria | la clasificación por gravedad existe; los protocolos de notificación no |

El motivo técnico de RF07 y RF16 es que Render no conserva archivos entre
reinicios. Es una restricción real de la infraestructura elegida, no un olvido,
pero está documentada como limitación en la guía de testers y no como desviación
en la documentación del sistema, que es donde la cátedra la buscaría.

**Sobre RF24**, que es fácil de leer mal: sí está implementado.
`MaquinariaController::listarRegistros()` calcula el consumo de combustible por
hora de cada registro y lo compara contra el promedio histórico de esa misma
máquina, marcando `alerta_consumo` cuando lo supera en más de 1,5 veces; la
interfaz lo muestra como «Consumo alto». El «rendimiento esperado» del
requerimiento se interpreta como el promedio propio de la máquina, no como un
objetivo declarado por alguien. Dos consecuencias que conviene conocer: una
máquina que siempre consume de más nunca se aparta de su propio promedio y no
alerta nunca, y esa alerta vive solo en el listado de registros de la máquina —
`AnalisisController`, que alimenta la pantalla de Alertas, emite únicamente
alertas de avance (RF11) y de material (RF12).

## Estado del ciclo de vida de la obra

Aparte de los RF, el TP3 define un ciclo de vida que el sistema hoy cubre casi
entero. `proyecto.estado` es un `ENUM` con los siete valores, y seis los asigna
alguien: `planificacion` al crear la obra, `en_ejecucion` desde
`AvanceController` con el primer avance, `pausada` desde `InactividadController`
cuando hay un período vigente, `en_revision` y `finalizada` desde
`ReporteController` al enviarse y aprobarse el reporte final, y `cancelada`
desde el formulario de obra. Solo falta `creada`, que el TP3 distingue de
`planificacion`.

El conflicto de reglas que había quedó resuelto a favor del TP3: la obra la
cierra el supervisor al aprobar el reporte final, y el avance físico dejó de
finalizarla por llegar al 100 %.

El detalle de esos huecos y su orden de resolución está en `REVISION-TPS.md`.
