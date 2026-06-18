# SGSO — Sistema de Gestión y Seguimiento Operativo de Obras

Proyecto académico (IC-413 Ingeniería del Software I, UNaM — Grupo 2).
Alcance del sprint: **RF01** (registrar/modificar/eliminar proyectos) y **RF02**
(información independiente por obra). Este README cubre además el **login**
(autenticación con usuario/contraseña, base para RF19 — roles y permisos).

## Stack

| Capa | Tecnología |
|---|---|
| Frontend (SPA) | React + Vite + TypeScript (carpeta `FRONT/`) |
| Backend (API REST) | Node.js + Express + TypeScript (carpeta `BACK/`) |
| Base de datos | MariaDB / MySQL |
| Autenticación | Contraseña hasheada con **bcryptjs** + **JWT** |

## Requisitos previos

- **Node.js** (LTS). El instalador está en `Intalar/node-v24.16.0-x64.msi`, o bajalo de [nodejs.org](https://nodejs.org).
- **MariaDB** corriendo localmente (también funciona con MySQL: el SQL usa solo
  sintaxis compatible con ambos). Verificado sobre **MariaDB 12.3**. Se puede
  administrar con **DBeaver**.

> **Puerto de la base:** MariaDB usa por defecto el puerto **3306**. Si la
> instalaste en otro puerto para convivir con un MySQL ya existente (ej. **3307**),
> ajustá `DB_PORT` en `BACK/.env` acorde.

---

## 1) Base de datos

1. Crear una base llamada **`sgso`** (en DBeaver: clic derecho en la conexión → *Create New Database*).
2. Ejecutar las migraciones **en orden**, desde un SQL Editor sobre `sgso`:
   - `BACK/migrations/001_planificacion.sql` — tablas `usuario`, `proyecto`, `planificacion`, `avance_fisico`.
   - `BACK/migrations/002_auth.sql` — ajustes para el login (campo `fecha_creacion` y limpieza del seed inseguro).

> **Seguridad:** la columna `usuario.contrasena` guarda el **hash bcrypt**, nunca
> la contraseña en texto plano. El usuario admin de prueba **no** se inserta con
> contraseña en el SQL; se crea con el seed del backend (paso siguiente).

---

## 2) Backend (`BACK/`)

```bash
cd BACK
npm install                 # instala dependencias (incluye bcryptjs y jsonwebtoken)
cp .env.example .env        # configurar credenciales de DB y JWT_SECRET
npm run seed                # crea el usuario admin de prueba con contraseña hasheada
npm run dev                 # levanta la API en http://localhost:3000
```

Variables de entorno (`.env`):

| Variable | Descripción |
|---|---|
| `PORT` | Puerto de la API (3000) |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | Conexión a MariaDB |
| `JWT_SECRET` | Clave secreta para firmar los tokens (cambiar por una larga) |
| `JWT_EXPIRES_IN` | Validez del token (ej. `8h`) |

### Endpoints de autenticación

| Método | Ruta | Protección | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/login` | pública | Recibe `{ email, contrasena }`, devuelve `{ token, usuario }` |
| `POST` | `/api/auth/register` | solo `AdministradorSistema` | Crea un usuario nuevo (requiere token) |
| `GET` | `/api/auth/me` | requiere token | Devuelve el usuario del token actual |

Para llamar a una ruta protegida, enviar el header:
`Authorization: Bearer <token>`.

### Usuario de prueba (tras `npm run seed`)

```
email: admin@sgso.com
pass:  admin123
```

---

## 3) Frontend (`FRONT/`)

```bash
cd FRONT
npm install --legacy-peer-deps   # --legacy-peer-deps es necesario por conflictos de peers
npm run dev                       # levanta la SPA (Vite indica la URL, ej. http://localhost:5173)
```

Opcional: crear `FRONT/.env` a partir de `.env.example` para cambiar la URL de la
API (`VITE_API_URL`). Por defecto apunta a `http://localhost:3000/api`.

### Cómo funciona el login en el front

- `/login` es pública. El resto de las rutas están protegidas por `RequireAuth`:
  si no hay token, redirige a `/login`.
- Al iniciar sesión, el token y los datos del usuario se guardan en `localStorage`.
- El botón de **cerrar sesión** está en el pie del menú lateral.

---

## Flujo de prueba rápido

1. Levantar DB → ejecutar migraciones → `npm run seed` en `BACK`.
2. `npm run dev` en `BACK` y en `FRONT`.
3. Abrir el front, entrar con `admin@sgso.com` / `admin123`.
4. Verificar que sin sesión cualquier ruta redirige a `/login`.
