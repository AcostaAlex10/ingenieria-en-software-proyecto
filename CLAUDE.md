# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TriweProjectManagement (SGSO)** — Sistema de Gestión y Seguimiento Operativo de Obras de Construcción.
Academic project for IC-413 (Ingeniería del Software I, UNaM), Grupo 2.

The repository contains the full system: React SPA, PHP REST API and relational
schema. See `DOCUMENTACION.md` for domain context and traceability with the
course assignments, and `README.md` for setup instructions.

### Implemented architecture
| Layer | Folder | Technology | Deployment |
|---|---|---|---|
| SPA | `FRONT/` | React 18 + Vite 6 + TypeScript | Vercel |
| REST API | `back/` | PHP 8, no framework, PDO | Render (Docker, PHP + Apache) |
| Database | `back/sql/` | MariaDB / MySQL | Aiven |
| Alternative API | `back-node/` | Node.js + Express + TypeScript | **Not deployed** |

> **Which backend to edit:** always `back/` (PHP). The course requires PHP over
> MariaDB and that is what is deployed and consumed by the frontend. `back-node/`
> is a historical alternative kept for reference — do not add features there and
> do not treat it as the source of truth for the schema.

### User roles
- **AdministradorSistema** — superuser; manages accounts and role assignment
- **PersonalAdministrativo** — creates/edits projects, planning and materials; approves reports
- **PersonalTecnico** (Encargado de Obra) — registers daily advance, attendance, material consumption, machinery usage and incidents from the field
- **Gerente** — read-only: monitors advance, consults comparative reports

Role groups are declared as constants at the top of `back/public/index.php`
(`ROLES_GESTION_OBRA`, `ROLES_AVANCE`, `ROLES_DOC`, `ROLES_REPORTE_APROBAR`, `ROLES_ADMIN`).

## Commands

### Frontend (`FRONT/`)
```bash
npm install --legacy-peer-deps   # --legacy-peer-deps is required due to peer conflicts
npm run dev                      # Vite dev server
npm run build                    # production build
```

### Backend (`back/`)
```bash
php back/sql/migrar.php          # apply schema.sql to the configured database
php back/sql/seed.php            # create the initial admin user (bcrypt hash)
php -S localhost:8000 -t back/public
```

> There are no test or lint scripts configured anywhere in the repo.

## Architecture

### Frontend stack
- **React 18** + **React Router v7** (browser router)
- **Vite 6** with `@vitejs/plugin-react`
- **Tailwind CSS v4** via `@tailwindcss/vite` (no tailwind.config.js — config is in CSS)
- **shadcn/ui** component library (`src/app/components/ui/`)
- **Recharts** for charts, **Leaflet / react-leaflet** for maps
- Path alias `@` → `FRONT/src`

Entry points: `FRONT/index.html` → `src/main.tsx` → `src/app/App.tsx` → `src/app/routes.tsx`

### Routing (`src/app/routes.tsx`)
`/login`, `/olvide` and `/restablecer` are public. Every other route is wrapped by
the `Root` layout (sidebar + header) and requires an authenticated session:

| Route | Component | Purpose |
|---|---|---|
| `/` | `Dashboard` | Global KPIs and comparative charts |
| `/proyectos` | `ProyectosPage` | Register, modify, delete and filter projects |
| `/proyectos/:id` | `ProyectoDetallePage` | Single project detail |
| `/seguimiento` | `SeguimientoPage` | Daily advance, attendance, incidents, inactivity |
| `/materiales` | `MaterialesPage` | Assign materials to a project, register consumption |
| `/documentacion` | `DocumentacionPage` | Upload and query PDF/image files per project |
| `/reportes` | `ReportesPage` | Create, review and approve/reject operational reports |
| `/alertas` | `AlertasPage` | Active alerts (advance deviation, cost overrun) |
| `/maquinaria` | `MaquinariaPage` | Machinery usage logs, faults and maintenance |
| `/usuarios` | `UsuariosPage` | Account and role management |

### Backend (`back/`)
Single front controller: `back/public/index.php` parses the path (everything under
`/api`), validates the JWT and dispatches to a controller in `back/src/`. Resources:
`auth`, `health`, `proyectos`, `planificacion`, `materiales`, `maquinaria`,
`reportes`, `analisis`, `usuarios`.

Cross-cutting pieces: `Env` (dotenv loader), `Cors`, `Database` (PDO singleton),
`Jwt`, `AuthMiddleware`, `Mailer` (Brevo, for password recovery), `Geocoder`.

The timezone is pinned to `America/Argentina/Buenos_Aires` because Render runs in
UTC and date validations depend on the local date.

### Styling system
Styles live in `src/styles/`: `theme.css` (dark/orange theme, `--primary: #e8981e`),
`tailwind.css`, `globals.css`, `leaflet-custom.css`. `default_shadcn_theme.css` is
kept as a light-theme reference but is not applied.

### Domain model
Seventeen tables in `back/sql/schema.sql`. `proyecto` is the core entity:

- **proyecto** — one `planificacion`, many `avance_fisico`, `asistencia`, `incidencia`, `periodo_inactividad`, `item_excedente`, `documento`, `reporte`, `asignacion_material`
- **planificacion / etapa_planificacion** — expected advance and base budget per stage
- **avance_fisico** — daily physical advance records tied to a planning stage
- **material / asignacion_material / consumo_material** — catalog → per-project assignment → consumption with stock check
- **maquinaria / registro_maquinaria / falla_maquinaria** — equipment → usage logs → fault history
- **usuario** — `rol` enum + `activo` flag, bcrypt password hash, password-reset token

#### State values (as stored, lowercase)
- Project (`proyecto.estado`, default `planificacion`): `planificacion` → `en_ejecucion` ⇄ `pausada` → `finalizada`
- Report (`reporte.estado`, default `borrador`): `borrador` → `en_revision` → `aprobado` | `rechazado`
- Attendance (`asistencia.estado`): `presente` | `ausente` | `tarde`
- Incident (`incidencia`): type `clima` | `falla_maquinaria` | `proveedor` | `otro`; severity `baja` | `media` | `alta`

### Component conventions
- Page-level components live directly in `src/app/components/`; shadcn/ui primitives in `src/app/components/ui/`
- `src/app/components/figma/ImageWithFallback.tsx` handles Figma-exported images with graceful fallback
- The Vite config includes a custom plugin that resolves Figma asset paths; SVG and CSV are treated as static assets
