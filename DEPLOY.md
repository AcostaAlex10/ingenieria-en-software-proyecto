# Despliegue en la nube (plan gratuito)

Guía para publicar SGSO y que sea accesible desde cualquier lado, sin depender
de una PC encendida. Todo con capas gratuitas.

## Arquitectura

La app son **3 piezas** y cada una va a un servicio distinto:

| Pieza | Servicio sugerido (gratis) | Notas |
|---|---|---|
| **Frontend** (React/Vite) | **Vercel** | Siempre activo. `vercel.json` ya incluido para el ruteo del SPA. |
| **Backend** (Node/Express) | **Render** (Web Service free) | El plan free "duerme" tras ~15 min sin uso y tarda unos segundos en despertar. |
| **Base de datos** (MySQL/MariaDB) | **Aiven** o **Clever Cloud** (MySQL gratis) | El SQL es compatible MySQL/MariaDB. |

> Todo se despliega desde la rama del repo en GitHub. Conviene mergear primero a `main`.

---

## Paso 1 — Base de datos en la nube

1. Crear una cuenta en un proveedor de **MySQL gratis** (ej. [Aiven](https://aiven.io) o [Clever Cloud](https://www.clever-cloud.com)).
2. Crear una base MySQL. Anotar los datos de conexión: **host, puerto, usuario, contraseña, nombre de la base**.
3. Cargar el esquema y el usuario admin **desde tu PC**, apuntando a la base remota:
   - En `BACK/.env`, poner los datos de la base remota y `DB_SSL=true`.
   - Ejecutar:
     ```bash
     cd BACK
     npm install
     npm run build
     npm run migrate    # crea las tablas (idempotente)
     npm run seed       # crea el usuario admin con contraseña hasheada
     ```
   - Volver a dejar tu `.env` local como estaba si seguís desarrollando contra tu base local.

---

## Paso 2 — Backend en Render

1. En [Render](https://render.com) → **New → Web Service** → conectar el repo de GitHub.
2. Configurar:
   - **Root Directory**: `BACK`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. En **Environment** cargar las variables (las mismas de `.env`, pero con los datos de la base remota):

   | Variable | Valor |
   |---|---|
   | `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | los de la base en la nube |
   | `DB_SSL` | `true` |
   | `JWT_SECRET` | una clave larga y secreta |
   | `JWT_EXPIRES_IN` | `8h` |
   | `CORS_ORIGIN` | *(se completa en el Paso 4)* |

4. Deploy. Render da una URL tipo `https://sgso-backend.onrender.com`. Probar `https://.../api/health` → debe responder `{"status":"ok"}`.

---

## Paso 3 — Frontend en Vercel

1. En [Vercel](https://vercel.com) → **Add New → Project** → importar el repo.
2. Configurar:
   - **Root Directory**: `FRONT`
   - **Framework Preset**: Vite (lo detecta solo)
   - **Install Command**: `npm install --legacy-peer-deps`
3. En **Environment Variables** agregar:

   | Variable | Valor |
   |---|---|
   | `VITE_API_URL` | la URL del backend de Render + `/api` (ej. `https://sgso-backend.onrender.com/api`) |

4. Deploy. Vercel da una URL tipo `https://sgso.vercel.app`.

---

## Paso 4 — Conectar frontend y backend (CORS)

1. Volver a Render → variable `CORS_ORIGIN` = la URL de Vercel (ej. `https://sgso.vercel.app`).
2. Re-deploy del backend para que tome el cambio.

---

## Checklist final

- [ ] `https://.../api/health` responde OK.
- [ ] Abrir la URL de Vercel → redirige a `/login`.
- [ ] Login con `admin@sgso.com` / `admin123` → entra al dashboard.
- [ ] El backend solo acepta llamadas desde el dominio del frontend (CORS).

> **Nota para la cátedra:** si exigen MariaDB estricto, el mismo procedimiento sirve
> con un proveedor de MariaDB gestionada; el código no cambia (driver `mysql2`).
