# ADR-001: Lenguaje y forma del backend de SGSO

- **Estado:** aceptado
- **Fecha:** 2026-09-09
- **Aprobado por:** Alex Acosta, 2026-09-09 (incluidos los pesos de la sección 2)
- **Contexto de producto:** SGSO deja de ser trabajo de cátedra y pasa a evaluarse como producto vendible. Cliente potencial: Triwe. Nada cerrado.

---

## 1. Contexto

SGSO está desplegado y funcionando: frontend React + Vite + TypeScript en Vercel, API en PHP 8.3 sobre Render (Docker) y MariaDB/MySQL en Aiven.

Medido sobre el código, no de memoria:

| | |
|---|---|
| Backend PHP (`back/`) | 26 archivos, **4.109 LOC**, 17 tablas, ruteo propio de 58 ramas en `index.php` |
| Dependencias del backend | **ninguna**: no hay `composer.json`, es PHP plano |
| Frontend (`FRONT/src`, sin `ui/`) | **6.433 LOC**, 60 dependencias |
| TypeScript instalado en el front | **no** |
| Scripts en el front | solo `dev` y `build`: sin test, sin lint, sin typecheck |
| Backend alternativo (`back-node/`) | 2.106 LOC, Express + TS, **no desplegado** |

Dos hechos que condicionan la decisión y que conviene mirar de frente:

**El backend Node está congelado.** `back-node/` no se toca desde el commit `424972c`. Le faltan `es_final`, `cancelada` y la sincronización de estado por inactividad, o sea todo el ciclo de vida de la obra que se construyó después. No es un punto de partida gratis: es una copia vieja que habría que completar.

**Nadie chequea tipos hoy.** El front está escrito en TypeScript pero `typescript` no figura en `package.json`, y Vite compila sin verificar. Un error de tipos pasa el build y aparece en runtime. La "seguridad de tipos" que hoy se le atribuye al front es, en la práctica, documentación.

---

## 2. Criterios y pesos

Pesos propuestos para un producto que puede venderse, no para un TP. Si no coincidís con la ponderación, cambiala: la recomendación depende de ella.

| # | Criterio | Peso | Por qué ese peso |
|---|---|---:|---|
| a | Reutilizar lo hecho en PHP | 25 % | 4.109 LOC en producción con reglas de negocio no triviales |
| b | Mantenibilidad y testing | 30 % | Es la prioridad declarada del producto, y hoy es el hueco más grande |
| c | Unificar lenguaje con el front | 15 % | Vale, pero menos de lo que parece (ver §1) |
| d | Ecosistema, hosting y costos | 10 % | Ambos stacks son baratos y están resueltos |
| e | Camino a multi-cliente / SaaS | 20 % | Condiciona si Triwe se concreta |

---

## 3. Opciones

### A. Seguir en PHP plano, como está

No cambiar nada. Se sigue agregando código al ruteo manual, sin Composer ni tests.

### B. Migrar el backend a Node.js + TypeScript

Reescribir la API en Node LTS con TypeScript, partiendo de `back-node/` o de cero, y retirar PHP.

### C. Seguir en PHP, profesionalizándolo

Mantener el lenguaje y el código, e incorporar lo que hoy falta: Composer, un router real (Slim o similar), PHPUnit y tipado estricto verificado (PHPStan). Sin reescribir la lógica de negocio.

---

## 4. Evaluación

### a. Reutilizar lo hecho (25 %)

- **A: 10/10.** No se tira nada.
- **B: 3/10.** Se reescriben 4.109 LOC. `back-node/` cubre parte, pero le faltan las tres funcionalidades más recientes del ciclo de vida, que son justamente las de reglas más delicadas.
- **C: 9/10.** Se conserva la lógica; se reacomoda el ruteo y la infraestructura.

### b. Mantenibilidad y testing (30 %)

Hoy **no hay una sola prueba del backend**. Las cuatro suites que existen (Playwright) prueban el frontend contra el simulador, no PHP ni SQL.

- **A: 2/10.** Sin Composer no hay forma razonable de instalar PHPUnit. El ruteo de 58 ramas en un archivo crece mal.
- **B: 8/10.** Vitest o Jest, tipos verificados, e inyección de dependencias si se usa NestJS. Pero el punto de partida son 0 tests igual: migrar no escribe las pruebas solo.
- **C: 8/10.** PHPUnit y PHPStan dan lo mismo en PHP. El techo es parecido; la diferencia real no es el lenguaje sino la disciplina.

### c. Unificar lenguaje con el front (15 %)

Este es el argumento fuerte de B, y merece nombrarse bien. El problema concreto que resolvería no es "escribir en un solo idioma", es que **hoy hay dos implementaciones del mismo contrato**: `back/` en PHP y `FRONT/src/app/mock/servidor.ts` en TypeScript. Cada vez que se toca una validación hay que tocar las dos, y cuando se desincronizan la demo acepta datos que el sistema real rechaza. Ya pasó tres veces.

- **A: 2/10.** El problema queda intacto.
- **B: 8/10.** Con Node se puede compartir el esquema de validación (Zod) entre API, mock y front, y eliminar esa clase de bug de raíz.
- **C: 4/10.** No lo resuelve por sí solo, pero se puede mitigar sin cambiar de lenguaje: definir el contrato una vez en OpenAPI y generar de ahí los tipos del front y los casos del mock. Más barato que migrar.

### d. Ecosistema, hosting y costos (10 %)

- PHP 8.4 tiene soporte activo hasta el 31/12/2026 y de seguridad hasta el 31/12/2028; 8.5 salió en noviembre de 2025 y llega hasta 2029 ([HeroDevs, 2026](https://www.herodevs.com/blog-posts/php-end-of-life-dates-support-timeline-for-every-version-2026)). No hay riesgo de quedarse sin plataforma.
- Node 24 es Active LTS con EOL el 30/04/2028, y Node 26 pasa a LTS en octubre de 2026 ([Node.js releases](https://nodejs.org/en/about/previous-releases)).
- Costos: idénticos. El mismo Render, el mismo Aiven. Node arranca más rápido en frío que PHP+Apache en Docker, lo que ayuda con el plan gratuito de Render.
- **A: 7/10 · B: 8/10 · C: 8/10.**

### e. Camino a multi-cliente / SaaS (20 %)

Multi-tenant se decide en el **modelo de datos**, no en el lenguaje: hoy no hay noción de cliente, ni `id_organizacion` en ninguna de las 17 tablas, ni aislamiento por fila. Ese trabajo es idéntico en PHP y en Node, y es mucho mayor que el de migrar el lenguaje.

- **A: 3/10.** El ruteo manual y la falta de capa de servicios lo hacen más caro.
- **B: 7/10.** Ecosistema más rico para facturación, colas y feature flags.
- **C: 6/10.** Con una capa de servicios y middleware de tenant se llega bien; menos librerías de estante.

### Resultado ponderado

| Criterio | Peso | A | B | C |
|---|---:|---:|---:|---:|
| a. Reutilizar | 25 % | 10 | 3 | 9 |
| b. Mantenibilidad y testing | 30 % | 2 | 8 | 8 |
| c. Unificar lenguaje | 15 % | 2 | 8 | 4 |
| d. Ecosistema y costos | 10 % | 7 | 8 | 8 |
| e. Multi-cliente | 20 % | 3 | 7 | 6 |
| **Total** | | **4,3** | **6,7** | **7,3** |

---

## 5. Decisión

**Se adopta la opción C: seguir en PHP y profesionalizarlo.**

El razonamiento en una línea: el problema de SGSO hoy no es el lenguaje, es que **no hay red de seguridad**. Cero pruebas de backend, cero verificación de tipos, cero CI. Migrar a Node no resuelve nada de eso por sí mismo — deja el mismo cero de pruebas, escrito en otro idioma, después de gastar semanas reescribiendo lógica que ya funciona.

Los cuatro puntos que sostienen la decisión:

1. **B paga por adelantado y cobra después.** Reescribir 4.109 LOC de reglas de negocio en producción, justo cuando puede aparecer una venta, es el peor momento posible para introducir regresiones. Y hay evidencia local de ese costo: `back-node/` se abandonó y quedó sin las tres funcionalidades más recientes.
2. **El techo de calidad es parecido.** PHPUnit y PHPStan dan garantías equivalentes a Vitest y `tsc`. Lo que falta es disciplina, no plataforma.
3. **El argumento más fuerte de B tiene una salida barata.** La duplicación entre PHP y el simulador es real y ya costó errores, pero se ataca definiendo el contrato una vez en OpenAPI y generando desde ahí, sin cambiar de lenguaje.
4. **Multi-tenant no depende de esto.** Es trabajo de modelo de datos, igual de caro en los dos stacks, y es el que de verdad decide si Triwe es viable.

### Qué implica C, concretamente

En orden, y cada punto es su propia tarea con su propio visto bueno:

1. `composer.json` con autoload PSR-4, y mover `back/src/` a namespaces.
2. PHPUnit con pruebas sobre las reglas que hoy no tienen ninguna: ciclo de vida de la obra, permisos por rol, cierre por reporte final.
3. PHPStan en nivel medio, subiendo de a poco.
4. Reemplazar el ruteo de 58 ramas de `index.php` por Slim, o extraer una tabla de rutas. **Sin reescribir controladores.**
5. CI en GitHub Actions: PHPUnit + PHPStan + el build del front + las cuatro suites de Playwright.
6. Instalar `typescript` en el front y agregar un script `typecheck`.

### Qué NO decide este ADR

- Multi-tenant y modelo de datos por cliente: va en un ADR aparte.
- Qué hacer con `back-node/`. Mi recomendación es archivarlo o borrarlo una vez aprobada esta decisión, porque hoy invita a tocar el backend equivocado. Requiere tu OK.
- Framework concreto (Slim vs Laravel): se decide en el punto 4, con su propio ADR si la diferencia lo amerita.

---

## 6. Consecuencias

**A favor:** no se pierde trabajo ni tiempo de calendario; la calidad sube donde hoy hay cero; el riesgo de regresión es bajo porque no se reescribe lógica.

**En contra:** el equipo sigue con dos lenguajes; la duplicación con el simulador persiste hasta que se haga el contrato OpenAPI; menos librerías de estante para SaaS que en Node.

**Cuándo reabrir esta decisión:** si Triwe se concreta y exige multi-tenant real con facturación, conviene reevaluar B antes de escribir esa capa — migrar es más barato antes de construirla que después. También si el equipo cambia y nadie sostiene PHP.

---

## Fuentes

- [PHP End-of-Life Dates: Support Timeline for Every Version (2026), HeroDevs](https://www.herodevs.com/blog-posts/php-end-of-life-dates-support-timeline-for-every-version-2026)
- [Node.js Releases, nodejs.org](https://nodejs.org/en/about/previous-releases)
- [Evolving the Node.js Release Schedule, nodejs.org](https://nodejs.org/en/blog/announcements/evolving-the-nodejs-release-schedule)
