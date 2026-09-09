# Traspaso de contexto — SGSO

Punto de entrada para retomar el trabajo desde otra máquina, otra sesión o la
nube. Resume dónde está cada cosa, qué está hecho, qué falta y con qué trampas
ya nos topamos.

Última actualización: 9 de septiembre de 2026.

---

## 1. Cómo retomar

**Repositorio:** `AcostaAlex10/ingenieria-en-software-proyecto` — público.

> ### ⚠ Lo primero: hay una migración sin correr
>
> `proyecto.estado` pasó a `ENUM` en `schema.sql`, pero **eso no altera la base
> ya creada**. Hay que correr una vez, contra Aiven:
>
> ```powershell
> $env:DB_HOST="…"; $env:DB_PORT="…"; $env:DB_NAME="…"
> $env:DB_USER="…"; $env:DB_PASSWORD="…"; $env:DB_SSL="true"
> php back/sql/migracion-estado-enum.php
> ```
>
> Los cinco valores están en Render → el servicio del backend → Environment.
> El script es idempotente y aborta sin tocar nada si encuentra estados fuera de
> la lista. **No hay urgencia**: hasta que se corra, `estado` sigue siendo
> `VARCHAR` y acepta `pausada` igual, así que el sistema funciona; lo que falta
> es la restricción que impide guardar un estado inválido.

**Rama de trabajo: `main`.** Ahí va todo el desarrollo, y ahí despliegan Vercel
y Render.

**`testing` está congelada a propósito.** Es la rama de la demo estática que usa
el equipo de testers, y es la única que dispara el workflow de Pages. No la
muevas sin acordarlo: actualizarla les cambia el sitio bajo los pies. Hoy está
11 commits atrás de `main`.

```bash
git clone https://github.com/AcostaAlex10/ingenieria-en-software-proyecto.git
cd ingenieria-en-software-proyecto
git checkout main
```

**Qué leer, en este orden:**

| Documento | Para qué |
|---|---|
| `README.md` | arquitectura y cómo levantar el sistema |
| `DOCUMENTACION.md` | contexto del proyecto, modelo de datos, trazabilidad con los TP |
| `REVISION-TPS.md` | correcciones del docente y divergencias entre los TP y el código |
| `RESUMEN-TPS.md` | qué dice cada uno de los cuatro TP y en qué quedó |
| `GUIA-TESTERS.md` | lo que necesita un equipo externo para probar, con la tabla de los 28 RF |
| `FRONT/MODO-PRUEBA.md` | el modo estático: cómo funciona y cómo publicarlo |
| `DEPLOY.md` | despliegue en la nube |
| `back/README.md` | la API PHP en detalle |

---

## 2. Entornos

| | URL | Qué es |
|---|---|---|
| Sistema real | https://ingenieria-en-software-proyecto.vercel.app/ | SPA en Vercel contra la API PHP |
| API | https://ingenieria-en-software-proyecto.onrender.com/api | PHP + Apache en Render (Docker) |
| Base | Aiven | MySQL/MariaDB gestionada |
| Demo estática | https://acostaalex10.github.io/ingenieria-en-software-proyecto/ | GitHub Pages, sin backend |

La demo estática se publica sola con el workflow `.github/workflows/pages-testing.yml`
en cada push a `testing`, que es la rama del sitio estático; `main` lleva la
aplicación real y no republica la demo. Compila con `BASE_PATH=./`,
`VITE_HASH_ROUTER=1` y `VITE_MOCK=1`, que es la combinación verificada sirviendo
el sitio desde un subdirectorio.

Comprobación rápida de que todo sigue en pie:

```bash
curl -s https://ingenieria-en-software-proyecto.onrender.com/api/health
curl -s -o /dev/null -w "%{http_code}\n" https://acostaalex10.github.io/ingenieria-en-software-proyecto/
```

La API puede tardar cerca de un minuto en responder la primera vez: el plan
gratuito de Render suspende el servicio tras unos minutos sin uso.

---

## 3. Estructura del código

```
FRONT/            SPA React 18 + Vite 6 + TypeScript
  src/app/components/   una pantalla por módulo
  src/app/api/          cliente de la API
  src/app/auth/         sesión, permisos y api.ts (punto único de salida)
  src/app/mock/         servidor simulado + datos.json  ← modo estático
  scripts/              empaquetado de la demo en un solo .html
back/             API REST en PHP 8 sin framework — este es el backend
  public/index.php      front controller: rutas, token y roles
  src/                  un controlador por recurso
  sql/                  schema.sql (17 tablas), migrar.php, seed.php
                        migracion-estado-enum.php (cambios de tipo)
back-node/        API equivalente en Node — NO se despliega, no tocar
```

**El backend del proyecto es `back/` (PHP).** La cátedra lo exige. `back-node/`
quedó como alternativa histórica.

Todas las peticiones del frontend pasan por `transporte()` en
`FRONT/src/app/auth/api.ts`, que elige entre la API real y el simulador según
`VITE_MOCK`. Si agregás un endpoint en PHP, agregá su equivalente en
`FRONT/src/app/mock/servidor.ts` o el modo estático responderá 404 en esa ruta.

---

## 4. Estado

Los diez módulos están implementados y funcionando: proyectos, planificación por
etapas, avance físico, seguimiento (asistencia e incidencias), materiales con
control de excedidos, documentación, reportes con circuito de aprobación,
análisis y alertas, maquinaria, y gestión de usuarios.

Los roles y permisos (RF19) se aplican en el servidor, y el Personal Técnico no
recibe el presupuesto (RF20). Verificado contra producción y contra el modo
estático.

Sobre eso, lo que se agregó en la sesión del 9 de septiembre:

- **Pausa de obra por inactividad (RF25 y el ciclo del TP3).** Registrar un
  período vigente pasa la obra a `pausada`; cerrarlo con **Continuar obra**, o
  eliminarlo, la devuelve a `en_ejecucion`. Endpoint nuevo:
  `PUT /api/proyectos/inactividad/{id}`.
- **`proyecto.estado` como `ENUM`** con los siete estados del TP3 — falta correr
  la migración contra la base desplegada, ver el aviso de arriba.
- **Correcciones C4 y C5 del docente** aplicadas en `DOCUMENTACION.md`, y RF03
  reasignado de HU01 a HU02.
- **Validaciones del simulador** puestas a la par del backend: el mock aceptaba
  rangos de fecha invertidos y etapas sin validar, que PHP ya rechazaba.
- **Códigos RF fuera de la interfaz**: 16 apariciones en 6 pantallas.

Y en la sesión siguiente:

- **Cancelación de obra.** El formulario de edición incorpora el campo estado,
  con `cancelada` como única opción manual y solo desde `en_ejecucion` o
  `pausada`, restringido a los roles de gestión de obra. `ProyectoController` y
  el simulador rechazan lo mismo: `422` si se intenta asignar a mano cualquier
  otro estado, `409` si la obra no admite cancelarse. El alta ignora el estado
  que reciba.
- **Arreglo de la edición de obras.** El campo de fecha de inicio llevaba el
  piso de hoy también al editar, así que el navegador daba por inválido el
  formulario de cualquier obra ya empezada: no se podía guardar ningún cambio.
  Ahora el piso aplica solo al alta, como en `ProyectoController::registrar()`.

El TP4 está cerrado. La demo estática está publicada y verificada.

---

## 5. Pendientes

**Operación**, y va primero: correr `back/sql/migracion-estado-enum.php` contra
Aiven, como explica el aviso de la sección 1.

**Del código**, ninguno bloqueante. En orden de valor:

1. **Decidir qué hacer con RF07 y RF16.** La documentación se guarda como enlace
   (`documento.url`), no como archivo. Son dos requerimientos «Importante» sin
   cumplir. Tres caminos: almacenamiento externo, BLOB en la base, o dejarlo así
   y documentar la desviación con su fundamento en `DOCUMENTACION.md` —hoy solo
   figura en la guía de testers, que la cátedra no lee—. Es una decisión de
   grupo, no una tarea.
2. **Incorporar `EnRevision` para el proyecto**, ligado a la aprobación del
   reporte final. El más invasivo, y arrastra una decisión: el TP3 dice que la
   obra se finaliza cuando el supervisor aprueba, y `AvanceController` la
   finaliza sola al 100 %. Las dos reglas no conviven; hay que elegir antes de
   escribir código.
3. **Completar RF26**: `incidencia.gravedad` clasifica, pero no dispara los
   protocolos de notificación que pide el requerimiento. `Mailer` ya funciona.
4. **Llevar la alerta de maquinaria a la pantalla de Alertas.** RF24 está
   cumplido —`MaquinariaController` compara contra el promedio de cada máquina—
   pero esa alerta no llega a `AnalisisController`, que solo emite las de avance
   y material.
5. **Distinguir `Creado` de `Planificado`.**

**De la documentación**: quedan **C1, C2 y C3**, que son ediciones sobre el PDF
del TP2 (los actores del diagrama, y el nombre y las condiciones del CU22) y no
se pueden hacer desde el repositorio. La redacción de reemplazo está propuesta
en `REVISION-TPS.md`. C4 y C5 ya están aplicadas en `DOCUMENTACION.md`.

**Deuda técnica** anotada en `DOCUMENTACION.md`: no hay pruebas automatizadas,
`back-node/` duplica el backend, las migraciones están descritas por duplicado,
`proyecto.encargado` es texto libre en vez de una referencia a `usuario`, y
`proyecto.avance` se guarda plano en lugar de calcularse desde `avance_fisico`.

**Operativo:** hay un solo administrador activo. Si se pierde el acceso a esa
cuenta no hay forma de entrar a gestionar usuarios, porque el sistema exige que
siempre quede al menos uno. Conviene tener un segundo administrador de respaldo.

---

## 6. Credenciales

**Ninguna credencial va en este repositorio, que es público.**

| Qué | Dónde está |
|---|---|
| Base Aiven, JWT, Brevo | variables de entorno del servicio en Render |
| Cuentas del sistema | las administra el equipo desde la pantalla de Usuarios |
| Cuenta para testers | la provee el equipo por separado |

El seed ya no trae contraseña escrita en el código: la toma de
`SEED_ADMIN_PASSWORD` y aborta si no está definida.

```bash
SEED_ADMIN_PASSWORD=una-clave-larga php back/sql/seed.php
```

> Antecedente: `back/sql/seed.php` tenía la contraseña del administrador
> hardcodeada. Al pasar el repositorio a público quedó expuesta en el historial.
> La cuenta `admin@sgso.com` fue dada de baja y reemplazada. La contraseña sigue
> en el historial de git, pero ya no sirve para entrar.

Las únicas contraseñas que sí están versionadas, a propósito, son las del modo
estático (`FRONT/src/app/mock/datos.json`): son ficticias, con dominio `.test`, y
no existen en ningún sistema real.

---

## 7. Trampas conocidas

Cosas que ya nos costaron tiempo. Vale la pena leerlas antes de repetirlas.

**GitHub Actions — reintentar un run viejo no sirve.** "Re-run failed jobs" sobre
un run de días atrás falla con `No artifacts named "github-pages" were found`.
`actions/upload-pages-artifact` retiene el artefacto un solo día y el job de
compilación no se vuelve a ejecutar. Hay que mirar el run nuevo, o usar "Re-run
all jobs".

**GitHub Pages necesita habilitarse explícitamente.** Que el repositorio sea
público no alcanza: hay que poner Settings → Pages → Source en "GitHub Actions".
Sin eso el despliegue falla con `status: 404` aunque el build pase.

**Sesión única por cuenta.** Iniciar sesión con la misma cuenta en otro lado
cierra la anterior. Aparece como "se cerró sola" cuando en realidad es el
comportamiento esperado.

**El servidor de pruebas de Python sirve `.js` como `text/plain`** en Windows, y
el navegador rechaza el módulo. Además es mono-hilo y se cuelga con las
conexiones persistentes del navegador. Para probar un build estático hay que
usar un servidor que fije el MIME y sea multihilo.

**`String.replace()` con el bundle minificado.** El código minificado contiene la
secuencia `$&`, que `replace()` interpreta como "el texto que coincidió" y
sustituye en silencio, corrompiendo el JavaScript. Hay que pasar el reemplazo
como función. Lo aplica `FRONT/scripts/demo-un-archivo.mjs`.

**El antivirus borra los scripts PHP que se conectan a la base.** `migrar.php` y
similares desaparecen del working tree. Están commiteados, así que conviene no
hacer `git add -A` a ciegas. Aplica también a
`migracion-estado-enum.php`: si no aparece, `git checkout` sobre ese archivo.

**`migrar.php` no aplica cambios de tipo de columna.** Solo ejecuta
`schema.sql`, y todas sus tablas usan `CREATE TABLE IF NOT EXISTS`: sobre una
base que ya existe es un no-op. Cambiar un tipo en `schema.sql` afecta
únicamente a instalaciones nuevas. Para una base ya creada hace falta un script
aparte con su `ALTER` — como `migracion-estado-enum.php`. Es la razón por la que
el `ENUM` puede estar en el repo y no en Aiven al mismo tiempo.

**El simulador se desincroniza del backend sin que nadie lo note.**
`FRONT/src/app/mock/servidor.ts` reproduce el contrato de la API, pero es código
aparte: si PHP valida algo y el mock no, la demo acepta datos que el sistema real
rechaza, que es la peor combinación posible para un tester. Ya pasó con el rango
de fechas y con las etapas. Al tocar una validación en PHP, tocá también el mock.

**En el mock, las obras se identifican por `id`, no por `id_proyecto`.** El resto
de las colecciones sí usa `id_proyecto`. Un `find` con la clave equivocada
devuelve `undefined` en silencio y la función parece no hacer nada.

**La clave de `localStorage` del mock lleva la huella de `datos.json`.**
`localStorage` es por origen, no por versión del sitio: sin eso, republicar la
demo dejaba a quien ya hubiera entrado viendo su copia vieja. Si cambiás la forma
de los datos, el sufijo cambia solo y las copias viejas se descartan. No lo
vuelvas a una constante fija.

**El preview de Vercel de una rama mezcla frontend nuevo con backend viejo.**
Compila el frontend de esa rama, pero apunta a la API de Render, que se despliega
desde `main`. Una función que dependa de un endpoint nuevo va a fallar ahí hasta
que el backend también esté desplegado.

---

## 8. Cómo verificar que sigue todo bien

```bash
# Compilar el modo estático y servirlo
cd FRONT
npm install --legacy-peer-deps
BASE_PATH=./ VITE_MOCK=1 VITE_HASH_ROUTER=1 npm run build

# Empaquetar la demo en un archivo suelto
VITE_MOCK=1 VITE_HASH_ROUTER=1 ARCHIVO_UNICO=1 npm run build
node scripts/demo-un-archivo.mjs      # deja dist/demo.html

# Levantar el sistema completo en local
php back/sql/migrar.php
php -S localhost:8000 -t back/public
cd FRONT && npm run dev
```

### Pruebas automatizadas del modo estático

En `FRONT/scripts/pruebas/` hay cuatro guiones que manejan un navegador real
contra el build estático. No son pruebas unitarias del backend —eso sigue siendo
deuda pendiente— pero cubren de punta a punta lo que más se rompe. Cómo correrlos
está en `FRONT/scripts/pruebas/README.md`.

| Guion | Qué cubre |
|---|---|
| `humo.mjs` | los cuatro roles: login, RF19, RF20, las ocho pantallas y la recarga en `#/alertas` |
| `inactividad.mjs` | pausar y reactivar la obra, con sus casos borde |
| `validaciones.mjs` | rango de fechas invertido, en el navegador y en el simulador |
| `persistencia.mjs` | la copia de `localStorage` y su invalidación |

Si tocás el mock o el ciclo de estados, corrélos antes de pushear.

El recorrido manual equivalente, por si preferís a mano: entrar con cada uno de
los cuatro roles, comprobar que el Técnico no ve presupuesto y que no le aparece
el menú de Usuarios, y recargar la página estando en `#/alertas` para confirmar
que la ruta sobrevive. Las cuentas están en `FRONT/MODO-PRUEBA.md`.
