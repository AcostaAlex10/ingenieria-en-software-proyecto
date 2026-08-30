# Revisión del sistema contra los TP2, TP3 y TP4

Contraste entre lo que documentan los trabajos prácticos y lo que hace hoy el
sistema. Incluye las correcciones del docente, que están cargadas como
anotaciones dentro de los PDF y no en su texto.

Revisado sobre el código de `back/` y `FRONT/`, no sobre el entorno desplegado.

---

## 1. Correcciones del docente

Cinco anotaciones: tres en el TP2 y dos en el TP3.

| # | TP | Ubicación | Anotación | Alcance |
|---|---|---|---|---|
| C1 | TP2 | pág. 11, diagrama de casos de uso | "sugiero duplicar los actores de este lado para que las líneas no queden por arriba de los CU" | Solo el diagrama |
| C2 | TP2 | pág. 15, CU22 | "revisar este nombre del CU" | Documento |
| C3 | TP2 | pág. 15, CU22 | "revisar estas pre y pos condiciones" | Documento |
| C4 | TP3 | pág. 3, ciclo de vida del proyecto | "De EnRevision no puede pasar a Pausado?" | Documento y código |
| C5 | TP3 | pág. 5, ciclo de vida del reporte | "faltan estados, puede tener un estado cancelado" | Documento y código |

### C1 — Actores en el diagrama de casos de uso

Es una observación de legibilidad del diagrama. No afecta al sistema.

### C2 — Nombre del CU22

El documento se contradice a sí mismo. En la tabla de inventario de casos de uso
el CU22 figura como **"Registrar consumo de materiales"**, mientras que la ficha
de especificación de la página 15 lo denomina **"Carga de materiales, registro
de consumo"**.

Ese segundo nombre tiene dos problemas. Nombra dos objetivos en un mismo caso de
uso, y la carga o asignación de materiales ya es el CU6 ("Asignar materiales a
obra"), que la propia ficha declara como caso similar. Además rompe la
convención del resto del documento, donde los casos de uso se nombran con un
verbo en infinitivo.

Corresponde unificarlo como **"Registrar consumo de materiales"**, que es el
nombre del inventario y el que coincide con lo implementado: el endpoint
`POST /api/proyectos/material/{idAsignacion}/consumos` registra consumo sobre un
material previamente asignado, y la asignación es una operación separada.

### C3 — Precondiciones y poscondiciones del CU22

Tal como están redactadas no son condiciones sino eventos y resultados de otros
casos de uso:

| Campo | Texto actual | Problema |
|---|---|---|
| Precondiciones | "Ocurre agotamiento de materiales. / Utilización de materiales." | Son sucesos, no un estado verificable del sistema previo a ejecutar el caso |
| Poscondiciones | "Se cargan materiales. / Se analiza el presupuesto en base al avance." | Lo primero corresponde al CU6; lo segundo es el resultado del CU23 |

Redacción propuesta, alineada con lo que el sistema efectivamente exige y deja
como resultado:

- **Precondiciones**: el usuario inició sesión con rol Personal Técnico o
  Administrador del Sistema; la obra existe y está en ejecución; el material ya
  fue asignado a la obra mediante el CU6.
- **Poscondiciones**: queda registrado un consumo con su fecha y cantidad
  asociado a la asignación; se actualiza la cantidad consumida y la restante; si
  el consumo acumulado supera la cantidad asignada, la asignación queda marcada
  como excedida y se genera la alerta correspondiente (RF12).

El texto "Ocurre agotamiento de materiales" encaja en cambio como extensión del
flujo alternativo, que la propia ficha ya contempla en el punto 3 ("El material
no posee stock suficiente").

### C4 — Ciclo de vida del proyecto

El diagrama del TP3 modela estos estados y transiciones:

```
● → Creado → Planificado → EnEjecucion ⇄ Pausado
                              ↕              ↓
                          EnRevision → Cancelado
                              ↓
                          Finalizado
```

- `EnEjecucion → Pausado`: se registra período de inactividad
- `Pausado → EnEjecucion`: fin del período de inactividad
- `EnEjecucion → EnRevision`: el Personal Técnico completa el reporte final
- `EnRevision → EnEjecucion`: reporte rechazado
- `EnRevision → Finalizado`: el supervisor aprueba reporte y certificación
- `EnEjecucion → Cancelado` y `Pausado → Cancelado`: decisión gerencial

La pregunta del docente apunta a una transición faltante: si una obra está en
revisión y se registra un período de inactividad, debería poder pasar a Pausado.
**Corresponde agregar `EnRevision → Pausado` al diagrama.**

### C5 — Ciclo de vida del reporte

El diagrama del TP3 modela `Borrador → EnRevision → Aprobado`, con el rechazo
del supervisor devolviendo el reporte a `Borrador`.

El docente señala que faltan estados y sugiere uno cancelado. **Corresponde
agregar `Cancelado`**, alcanzable desde `Borrador` (el técnico descarta un
reporte que no va a enviar) y desde `Rechazado`.

---

## 2. Divergencias entre los TP y el sistema implementado

Estas no las marcó el docente. Surgen de comparar los diagramas del TP3 con el
código, y conviene resolverlas antes de que las encuentre la cátedra.

### 2.1. Estados del proyecto: faltan tres de los siete

El TP3 define siete estados. El sistema usa cuatro, y con otros nombres.

| Estado en el TP3 | En el sistema | Situación |
|---|---|---|
| Creado | — | No existe. Una obra nace directamente en `planificacion` |
| Planificado | `planificacion` | Existe, pero fusiona Creado y Planificado |
| EnEjecucion | `en_ejecucion` | Correcto |
| Pausado | `pausada` | El valor existe, pero nada lo asigna |
| EnRevision | — | **No existe** |
| Finalizado | `finalizada` | Existe, pero se alcanza por otro camino |
| Cancelado | — | **No existe** |

Detalle de lo verificado en el código:

- `back/sql/schema.sql` define `proyecto.estado` como `VARCHAR(30)` con valor por
  defecto `'planificacion'`, sin restricción de valores. Al no ser un `ENUM`,
  nada impide guardar un estado inválido.
- `AvanceController::sincronizarProyecto()` es lo único que cambia el estado:
  pasa de `planificacion` a `en_ejecucion` con el primer avance mayor a cero, y a
  `finalizada` al llegar al 100 %.
- `InactividadController` **no toca el estado**. Registrar un período de
  inactividad no pausa la obra, aunque el TP3 define esa transición.
- `ReporteController` no modifica el proyecto. Aprobar el reporte final no lleva
  la obra a `Finalizado`, como establece el diagrama; el sistema la finaliza por
  porcentaje de avance.
- El formulario de alta y edición de obras no incluye el campo estado, así que no
  hay forma de pausar ni cancelar una obra desde la interfaz.

### 2.2. Estados del reporte: el código tiene uno que el diagrama no

| Estado | En el TP3 | En el sistema |
|---|---|---|
| Borrador | Sí | `borrador` |
| EnRevision | Sí | `en_revision` |
| Aprobado | Sí | `aprobado` |
| Rechazado | No: el rechazo vuelve a Borrador | `rechazado`, con reenvío a `en_revision` |
| Cancelado | No (lo pide el docente) | No existe |

El comportamiento implementado es razonable, y de hecho mejor que el
diagramado: conservar `rechazado` como estado propio permite distinguir un
borrador nunca enviado de uno devuelto con observaciones, y `observacion_revision`
guarda el motivo. El problema es que el documento no lo refleja.

### 2.3. Nomenclatura

Los TP usan PascalCase (`EnEjecucion`, `EnRevision`) y el sistema usa snake_case
en minúscula (`en_ejecucion`, `en_revision`). Es una diferencia de convención,
no un defecto, pero conviene dejarlo aclarado en el informe para que no se lea
como una inconsistencia.

---

## 3. Qué conviene corregir, y dónde

Ordenado por costo y por impacto en la evaluación.

### En el documento, sin tocar código

1. Unificar el nombre del CU22 como "Registrar consumo de materiales" (C2).
2. Reescribir precondiciones y poscondiciones del CU22 (C3).
3. Agregar la transición `EnRevision → Pausado` al ciclo de vida del proyecto (C4).
4. Agregar `Cancelado` al ciclo de vida del reporte, y agregar también
   `Rechazado`, que el sistema ya implementa (C5 y punto 2.2).
5. Duplicar los actores en el diagrama de casos de uso (C1).
6. Aclarar la convención de nombres de estados entre el modelo y la base (2.3).

### En el código, si se decide cerrar la brecha

Ninguno de estos puntos es un error de funcionamiento: son funcionalidades
documentadas que no se construyeron. En orden de esfuerzo:

1. **Convertir `proyecto.estado` en `ENUM`** con los siete valores del TP3. Es un
   cambio de esquema de una línea y evita estados inválidos.
2. **Pausar la obra al registrar un período de inactividad**, y reactivarla al
   cerrarlo. `InactividadController` ya recibe el `id_proyecto` y las fechas.
3. **Permitir cancelar una obra** desde la interfaz, con el rol correspondiente.
   Es el único estado terminal que el TP3 define y el sistema no ofrece.
4. **Incorporar `EnRevision` para el proyecto**, conectado al circuito de
   aprobación de reportes: al aprobarse el reporte final, la obra pasa a
   `Finalizado`. Es el cambio más invasivo, porque toca la relación entre el
   módulo de reportes y el de obras.
5. Distinguir `Creado` de `Planificado`, de modo que una obra sin planificación
   cargada no figure ya como planificada.

---

## 4. Lo que sí cumple

Para que la revisión quede balanceada, esto se verificó como implementado y
consistente con los TP:

- Los cuatro roles del TP2 (Personal Administrativo, Personal Técnico, Gerente,
  Administrador del Sistema) existen como `ENUM` en `usuario.rol` y gobiernan la
  autorización real del backend.
- RF19 y RF20: los grupos de roles de `back/public/index.php` restringen cada
  operación, y el Personal Técnico no recibe el presupuesto de la obra.
- El CRUD de obras (CU1 a CU3), la planificación con etapas, el avance físico y
  la comparación entre esperado y real están implementados.
- El circuito de aprobación de reportes valida las transiciones y rechaza los
  saltos inválidos con código 409.
- Los módulos de materiales con control de excedidos, documentación, maquinaria,
  análisis y alertas responden a los RF que el TP4 declara como incorporados
  después del sprint.
- La arquitectura coincide con la del TP4: SPA React, API REST en PHP sin
  framework sobre MariaDB, con bcrypt y JWT.
