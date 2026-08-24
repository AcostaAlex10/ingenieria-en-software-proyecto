# Backend SGSO — API REST en PHP

API REST en PHP plano (sin framework, acceso a datos con PDO) sobre MariaDB / MySQL.
Es el backend del proyecto: el que está desplegado en Render y el que consume el
frontend. La alternativa en Node de `../back-node/` no se despliega.

Para el contexto del sistema ver [`../DOCUMENTACION.md`](../DOCUMENTACION.md);
para levantar todo el stack, [`../README.md`](../README.md).

## Requisitos

- PHP 8.1 o superior (usa `readonly` y `match`).
- Extensión PDO con driver MySQL.
- No hace falta Composer ni librerías externas.

## Cómo levantarlo

```bash
cp .env.example .env      # datos de la base, JWT_SECRET, credenciales de Brevo
php sql/migrar.php        # crea las tablas (idempotente)
php sql/seed.php          # crea el usuario administrador inicial
php -S localhost:8000 -t public
```

La API queda en `http://localhost:8000/api`. Con Apache o XAMPP, el
`public/.htaccess` ya trae la reescritura para que todo pase por `index.php`.

## Estructura

```
back/
  public/
    index.php     <- único punto de entrada: parsea la ruta, valida el token y delega
    .htaccess     <- reescritura para Apache
  src/
    Env.php, Cors.php, Database.php     <- configuración, CORS y conexión PDO
    Jwt.php, AuthMiddleware.php         <- emisión y validación de tokens
    Mailer.php                          <- correo de recuperación (Brevo)
    Geocoder.php                        <- geocodificación de la ubicación de la obra
    *Controller.php                     <- un controlador por recurso
  sql/
    schema.sql    <- modelo relacional (17 tablas)
    migrar.php    <- aplica schema.sql
    seed.php      <- usuario administrador inicial
  data/
    proyectos.seed.json   <- datos de ejemplo del prototipo (ya no se usan en runtime)
```

## Autenticación y roles

El login devuelve un **JWT** que hay que enviar en `Authorization: Bearer <token>`.
Las contraseñas se guardan hasheadas con bcrypt, nunca en texto plano.

Los grupos de roles autorizados están declarados como constantes al inicio de
`public/index.php`: `ROLES_GESTION_OBRA`, `ROLES_AVANCE`, `ROLES_DOC`,
`ROLES_REPORTE_APROBAR` y `ROLES_ADMIN`.

| Método | Ruta | Protección |
|---|---|---|
| POST | `/api/auth/login` | pública |
| POST | `/api/auth/olvide` | pública |
| POST | `/api/auth/restablecer` | pública |
| POST | `/api/auth/register` | solo `AdministradorSistema` |
| GET | `/api/auth/me` | requiere token |
| GET | `/api/health` | pública |

## Recursos

`proyectos`, `planificacion`, `materiales`, `maquinaria`, `reportes`, `analisis`
y `usuarios`. Bajo `proyectos/{id}` cuelgan además los subrecursos de
planificación, avances, asistencia, incidencias, materiales asignados,
documentos, períodos de inactividad e ítems excedentes.

### Ejemplo: CRUD de proyectos (CU1, CU2, CU3)

| Método | Ruta | Acción | Caso de uso |
|---|---|---|---|
| GET | `/api/proyectos` | Listar (`?q=texto` busca por nombre o ubicación) | — |
| GET | `/api/proyectos/{id}` | Ver uno | — |
| POST | `/api/proyectos` | Registrar | CU1 |
| PUT | `/api/proyectos/{id}` | Modificar | CU2 |
| DELETE | `/api/proyectos/{id}` | Eliminar | CU3 |

Body esperado en POST y PUT:

```json
{
  "nombre": "Obra Vial Ruta 14",
  "tipo": "Infraestructura Vial",
  "ubicacion": "Posadas, Misiones",
  "encargado": "Ing. Roberto Suénaga",
  "fechaInicio": "2026-01-15",
  "presupuesto": 15000000
}
```

Todos los campos son obligatorios. Si falta alguno responde `422` con
`{ "errors": { "nombre": "Obligatorio" } }`. Si ya existe un proyecto con el mismo
`nombre` y `ubicacion` responde `409` con `{ "error": "Obra ya existente" }`.

## Probarlo con curl

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"...","contrasena":"..."}' | jq -r .token)

curl http://localhost:8000/api/proyectos -H "Authorization: Bearer $TOKEN"
```

## Notas del modelo

- Las columnas usan snake_case (`fecha_inicio`) y el frontend espera camelCase
  (`fechaInicio`); el mapeo lo resuelve `MySqlProyectoRepository`.
- `proyecto.encargado` es un texto libre. En el modelo relacional del TP3 estaba
  previsto como una referencia a `usuario`; la normalización quedó pendiente.
- `proyecto.avance` se guarda como campo plano aunque en el diagrama de clases del
  TP3 se calcula a partir de `avance_fisico`.
