# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TriweProjectManagement (SGSO)** — Sistema de Gestión y Seguimiento Operativo de Obras de Construcción. The repository currently contains the **frontend prototype only** (built from Figma). The backend (API REST + MariaDB) does not exist yet in this repo; all data is currently static/mocked in the UI.

### Planned full-system architecture
| Layer | Technology | Purpose |
|---|---|---|
| SPA | React.js | Web UI for PersonalAdministrativo and Gerencia |
| PWA | React.js | Mobile/tablet UI for PersonalTecnico in the field |
| API REST | Node.js / PHP | Business logic, auth, role-based authorization |
| Database | MariaDB | Persistent storage for all entities |
| File Storage | S3/local | PDFs, images, attachments (accessed via API) |
| External | Sistema Municipal de Catastro | Provides domain data, fiscal lot status and urban restrictions via API |

### User roles
- **PersonalAdministrativo** — registers and manages projects; validates advances and reports
- **PersonalTecnico** (Encargado de Obra) — registers daily physical advances, attendance, material consumption, machinery usage and incidents from the field
- **Gerente** — monitors overall advance, consults comparative reports and generates strategic analysis
- **AdministradorSistema** — manages user accounts and role assignments

## Commands

All commands must be run from the `FRONT/` directory.

```bash
# Install dependencies (--legacy-peer-deps is required due to peer conflicts)
npm install --legacy-peer-deps

# Start dev server
npm run dev

# Production build
npm run build
```

> There are no test or lint scripts configured.

## Architecture

### Stack
- **React 18** + **React Router v7** (browser router)
- **Vite 6** with `@vitejs/plugin-react`
- **Tailwind CSS v4** via `@tailwindcss/vite` (no tailwind.config.js — config is in CSS)
- **shadcn/ui** component library (60+ pre-built components in `src/app/components/ui/`)
- **Recharts** for charts, **Leaflet / react-leaflet** for maps
- Path alias `@` → `FRONT/src`

### Entry points
- `FRONT/index.html` → `src/main.tsx` → `src/app/App.tsx` → `src/app/routes.tsx`

### Routing (`src/app/routes.tsx`)
A single `Root` layout (sidebar + header) wraps all pages:

| Route | Component | Use cases covered |
|---|---|---|
| `/` | `Dashboard` | Global KPIs: active projects, avg advance, active alerts |
| `/proyectos` | `ProyectosPage` | CU1–CU3: register, modify, delete projects |
| `/seguimiento` | `SeguimientoPage` | CU10–CU15: daily physical advance, attendance, incidents, external events |
| `/materiales` | `MaterialesPage` | CU6, CU7, CU22: assign materials to project, register consumption |
| `/documentacion` | `DocumentacionPage` | CU8, CU9, CU15: upload/query PDF, JPG, PNG files per project |
| `/reportes` | `ReportesPage` | CU17, CU18, CU22: create, review, approve/reject operational reports |
| `/alertas` | `AlertasPage` | CU16: view and classify active alerts (advance deviation, cost overrun, anomalous consumption) |
| `/maquinaria` | `MaquinariaPage` | CU16, CU17, CU20, CU23: log machinery use, register faults and maintenance |

### Styling system
All styles live in `src/styles/`:
- `theme.css` — CSS custom properties for the dark/orange theme (`--primary: #e8981e`)
- `tailwind.css` — Tailwind v4 source detection
- `globals.css` — base resets
- `leaflet-custom.css` — map overrides

The active theme is dark with orange accents. `default_shadcn_theme.css` is kept as a light theme reference but not currently applied.

### Domain model

The core entity is **PROYECTO**. Key domain entities and their relationships:

- **PROYECTO** — has one PLANIFICACION, many AVANCE_FISICO, ASISTENCIA, INCIDENCIA, EVENTO_EXTERNO, PERIODO_INACTIVIDAD, REPORTE, MAQUINARIA
- **PLANIFICACION** — groups expected advance items and base budgets; linked 1-to-many to AVANCE_FISICO
- **AVANCE_FISICO** — daily physical advance records (cantidad_ejecutada, porcentaje_avance, fecha, observaciones)
- **MATERIAL / ASIGNACION_MATERIAL / CONSUMO_MATERIAL** — catalog → assignment per project → daily consumption records with stock verification
- **MAQUINARIA / REGISTRO_MAQUINARIA / FALLA_MAQUINARIA** — equipment registry → daily use logs (horas_uso, combustible_consumido, produccion_realizada) → fault/maintenance history
- **REPORTE** — operational reports linked to a project, with approval workflow
- **USUARIO** — has a `rol` field (PersonalAdministrativo, PersonalTecnico, Gerente, AdministradorSistema) and `activo` flag

#### Project lifecycle states
`Creado` → `Planificado` → `EnEjecucion` ⇄ `Pausado` → `Cancelado`  
`EnEjecucion` → `EnRevision` → `Finalizado` (or back to `EnEjecucion` if report rejected)

#### Report lifecycle states
`Borrador` → `EnRevision` → `Aprobado` (Supervisor may reject back to `Borrador`)

### Component conventions
- Page-level components live directly in `src/app/components/` (e.g., `Dashboard.tsx`, `ProyectosPage.tsx`)
- Reusable shadcn/ui primitives are in `src/app/components/ui/`
- `src/app/components/figma/ImageWithFallback.tsx` handles Figma-exported images with graceful fallback
- The Vite config includes a custom plugin that resolves Figma asset paths; SVG and CSV are treated as static assets
