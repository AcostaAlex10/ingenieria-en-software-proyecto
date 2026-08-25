# Modo de prueba estático

Permite ejecutar el frontend **sin backend y sin base de datos**: las peticiones
se resuelven contra un servidor simulado en memoria, con datos ficticios. Sirve
para publicar la aplicación como sitio estático (GitHub Pages) y probar la
interfaz sin depender de Render ni de Aiven, y sin riesgo de alterar los datos
de la demo.

## Qué prueba y qué no

Prueba la **interfaz**: navegación, formularios, validaciones del lado del
cliente, estados de carga, filtros, cálculos que muestra la UI y el
comportamiento según el rol.

No prueba el sistema real: no se ejecuta PHP, ni SQL, ni la autorización del
servidor. Es un doble de prueba de la interfaz, no una prueba de integración ni
de extremo a extremo. Para eso hay que apuntar a un backend real.

## Cómo se activa

Con la variable de entorno `VITE_MOCK=1` en tiempo de compilación:

```bash
cd FRONT
VITE_MOCK=1 npm run dev      # desarrollo
VITE_MOCK=1 npm run build    # sitio estático en dist/
```

Sin esa variable, la aplicación se comporta igual que siempre y consume
`VITE_API_URL`. El servidor simulado se carga con un import dinámico, así que
**no entra en el bundle principal**: queda en un chunk aparte que el navegador
solo descarga cuando el modo está activo.

Ese chunk igual se genera al compilar, con los datos adentro, y queda publicado
junto al resto del sitio: no se ejecuta con el modo apagado, pero es accesible
por su URL. Por eso en `datos.json` no van hashes de contraseña, tokens ni
correos personales.

## Cuentas de prueba

Son ficticias y solo existen dentro del modo de prueba. No corresponden a
ninguna cuenta real del sistema.

| Rol | Email | Contraseña |
|---|---|---|
| AdministradorSistema | `admin@sgso.test` | `admin123` |
| PersonalAdministrativo | `administrativo@sgso.test` | `admin123` |
| PersonalTecnico | `tecnico@sgso.test` | `tecnico123` |
| Gerente | `gerente@sgso.test` | `gerente123` |

Iniciar sesión con cada una permite verificar RF19 y RF20: el simulador
reproduce los mismos grupos de roles que `back/public/index.php` y oculta el
presupuesto al `PersonalTecnico`.

## Datos

Los datos base están en `src/app/mock/datos.json`. Toman como punto de partida
la información real de la base de producción —las cuatro obras con sus
planificaciones, avances, materiales, maquinaria y reportes— y se completan con
registros de prueba en lo que la base tenía vacío: asistencias, incidencias,
documentos, períodos de inactividad e ítems excedentes. Se agregan además un
cronograma completo para la Obra Vial Ruta 14, un consumo que excede lo asignado
(RF12), reportes en los cuatro estados, los roles que la base no tiene y una
cuenta dada de baja. Así queda cubierta cada pantalla del sistema.

El inventario de lo que hay en la base, y su comparación con estos datos, está
en `src/app/mock/DATOS-PRODUCCION.md`.

Los cambios que hagas (crear una obra, registrar un avance) se guardan en
`localStorage`, así que sobreviven a una recarga. Para volver al punto de
partida, ejecutar en la consola del navegador:

```js
sgsoMockReset()
```

## Cómo se implementa

- `src/app/mock/datos.json` — datos ficticios.
- `src/app/mock/servidor.ts` — reproduce el contrato de la API PHP: rutas,
  códigos de estado, validaciones (422 por campo, 409 por duplicado), roles y
  los cálculos derivados (resumen de avance, análisis y alertas, totales de
  maquinaria, rendimiento por operario, materiales excedidos).
- `src/app/auth/api.ts` — todas las peticiones pasan por `transporte()`, que
  elige entre el backend real y el simulador. Ningún componente cambia.

Si agregás un endpoint al backend PHP, agregá su equivalente en `servidor.ts` o
el modo de prueba responderá 404 en esa ruta.

## Publicación del sitio de prueba

### Vercel (en uso)

El repositorio es privado, y GitHub Pages no está disponible para repositorios
privados con el plan actual. El sitio de prueba se publica como **preview de
Vercel** de la rama `testing`, que sí funciona con repositorios privados y no
requiere configuración adicional en el código: en Vercel el sitio vive en la
raíz del dominio y `vercel.json` ya resuelve el ruteo de la SPA.

Configuración en el proyecto de Vercel:

1. **Settings → Environment Variables**: agregar `VITE_MOCK` con valor `1`,
   marcando únicamente el entorno **Preview**. No marcar Production: eso
   convertiría el sitio de la demo en datos ficticios.
2. **Deployments**: buscar el deployment de la rama `testing` y usar
   **Redeploy**, para que tome la variable.

La URL resultante tiene la forma
`https://<proyecto>-git-testing-<usuario>.vercel.app`.

### GitHub Pages (en pausa)

El workflow `.github/workflows/pages-testing.yml` queda preparado pero con el
disparador automático desactivado, porque el paso de despliegue falla mientras
el repositorio sea privado. El job de compilación funciona correctamente.

Para reactivarlo hay que hacer público el repositorio y seguir los pasos que el
propio workflow documenta. Antes de hacerlo público conviene cambiar la
contraseña del usuario administrador, que está escrita en `back/sql/seed.php` y
es válida contra el sistema desplegado.

### Sin publicar nada

Para probar en la máquina, sin hosting ni backend:

```bash
cd FRONT
VITE_MOCK=1 npm run dev
```
