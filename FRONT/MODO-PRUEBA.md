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
**no entra en el bundle de producción**: queda en un chunk aparte que solo se
descarga cuando el modo está activo.

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

Los datos base están en `src/app/mock/datos.json`: seis obras en distintos
estados, planificaciones con etapas, avances, asistencias, incidencias,
materiales con un consumo excedido, documentos, reportes en los cuatro estados,
períodos de inactividad, ítems excedentes y maquinaria con registros y fallas.

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

## Publicación en GitHub Pages

El workflow `.github/workflows/pages-testing.yml` compila con `VITE_MOCK=1` y
publica en Pages. Solo corre en la rama `testing`, así que `main` y el
despliegue de Vercel no se ven afectados.

Configuración necesaria una sola vez en el repositorio:

1. **Settings → Pages → Source**: `GitHub Actions`.
2. **Settings → Environments → `github-pages` → Deployment branches**: agregar
   `testing`. Sin esto el deploy falla por política del entorno.

El sitio queda en `https://<usuario>.github.io/<repo>/`. El workflow define
`BASE_PATH` para que Vite compile con esa ruta base, copia `index.html` como
`404.html` (Pages no reescribe rutas como hace `vercel.json`) y agrega
`.nojekyll`.
