# Backend - Gestión de Proyectos (RF01)

API REST en PHP plano (sin framework) para el CRUD de Proyecto:
registrar, modificar, eliminar y listar (CU1, CU2, CU3 del TP3).

Por ahora los datos se guardan en `data/proyectos.json` en lugar de
MariaDB. Ver la sección "Cuando llegue MariaDB" más abajo.

## Requisitos

- PHP 8.1 o superior (usa `readonly`/`match`, sintaxis de PHP 8).
- No hace falta Composer ni ninguna librería externa.

## Cómo levantarlo

```bash
cd back
php -S localhost:8000 -t public
```

La API queda disponible en `http://localhost:8000`.

Si en algún momento usan Apache/XAMPP en vez del servidor embebido,
ya está el `public/.htaccess` con la reescritura necesaria para que
todo pase por `index.php`.

## Primer uso / reset de datos

`data/proyectos.json` es el archivo "vivo" (está en `.gitignore`, no
se sube a git). Si no existe, `JsonProyectoRepository` lo crea vacío
solo. Si quieren arrancar con los 3 proyectos de ejemplo que ya
conocen del prototipo de Figma:

```bash
cp data/proyectos.seed.json data/proyectos.json
```

## Endpoints

| Método | Ruta | Acción | Caso de uso |
|---|---|---|---|
| GET | `/api/proyectos` | Listar (`?q=texto` para buscar por nombre/ubicación) | - |
| GET | `/api/proyectos/{id}` | Ver uno | - |
| POST | `/api/proyectos` | Registrar | CU1 |
| PUT | `/api/proyectos/{id}` | Modificar | CU2 |
| DELETE | `/api/proyectos/{id}` | Eliminar | CU3 |

Body esperado en POST/PUT (JSON):

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

Campos obligatorios: `nombre`, `tipo`, `ubicacion`, `encargado`,
`fechaInicio`, `presupuesto`. Si falta alguno, responde `422` con:

```json
{ "errors": { "nombre": "Obligatorio" } }
```

Si ya existe un proyecto con el mismo `nombre` + `ubicacion`,
responde `409`:

```json
{ "error": "Obra ya existente" }
```

## Probarlo con curl, antes de tocar el frontend

```bash
# Listar
curl http://localhost:8000/api/proyectos

# Registrar
curl -X POST http://localhost:8000/api/proyectos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Escuela N12","tipo":"Construcción Edilicia","ubicacion":"Eldorado, Misiones","encargado":"Ing. Test","fechaInicio":"2026-06-01","presupuesto":5000000}'

# Modificar (reemplazar 4 por el id que devolvió el POST anterior)
curl -X PUT http://localhost:8000/api/proyectos/4 \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Escuela N12","tipo":"Construcción Edilicia","ubicacion":"Eldorado, Misiones","encargado":"Ing. Test","fechaInicio":"2026-06-01","presupuesto":5500000}'

# Eliminar
curl -X DELETE http://localhost:8000/api/proyectos/4
```

## Estructura

```
back/
  public/
    index.php       <- único punto de entrada, routing por método+URL
    .htaccess       <- solo necesario si se usa Apache
  src/
    Cors.php
    ProyectoRepositoryInterface.php   <- contrato del repositorio
    JsonProyectoRepository.php       <- implementación temporal (JSON)
    ProyectoController.php           <- validaciones + respuestas HTTP
  data/
    proyectos.seed.json   <- se versiona, datos de ejemplo
    proyectos.json        <- NO se versiona, es el "vivo"
```

## Cuando llegue MariaDB

Crear `src/MySqlProyectoRepository.php` implementando
`ProyectoRepositoryInterface` con PDO, y cambiar en `public/index.php`
la línea:

```php
$repositorio = new JsonProyectoRepository($rutaArchivoDatos);
```

por:

```php
$repositorio = new MySqlProyectoRepository($conexionPdo);
```

`ProyectoController` no cambia. Ahí también hay que resolver:
- El mapeo snake_case (columnas de la tabla, ej. `fecha_inicio`) a
  camelCase (lo que espera el frontend, `fechaInicio`).
- `encargado` hoy es un string suelto; en el modelo relacional del
  TP3 es un `id_responsable` que apunta a `USUARIO`, así que va a
  necesitar un JOIN para devolver el nombre.
- `avance` en el diagrama de clases del TP3 no es un campo de
  `Proyecto`, se calcula a partir de `AVANCE_FISICO`. Por ahora se
  guarda como campo plano para no bloquear el desarrollo de este
  módulo.
