import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRouter from './routes/auth';
import proyectosRouter from './routes/proyectos';
import planificacionRouter from './routes/planificacion';
import avancesRouter from './routes/avances';
import etapasRouter from './routes/etapas';
import analisisRouter from './routes/analisis';
import obraRouter from './routes/obra';
import materialesRouter from './routes/materiales';
import reportesRouter from './routes/reportes';
import maquinariaRouter from './routes/maquinaria';
import usuariosRouter from './routes/usuarios';
import { verifyJWT } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

// CORS: en local permite cualquier origen (comodo para desarrollo).
// En produccion se restringe a los dominios listados en CORS_ORIGIN
// (separados por coma), ej: CORS_ORIGIN=https://mi-front.vercel.app
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors({ origin: corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : true }));

app.use(express.json());

// --- Rutas publicas (no exigen token) ---
// Health-check: lo usan las plataformas de hosting para saber si el servicio esta vivo.
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// /login, /olvide y /restablecer son publicas; /register y /me validan el token
// puertas adentro del propio router.
app.use('/api/auth', authRouter);

// --- De aca en adelante TODO exige autenticacion (RF19) ---
// Se aplica UNA sola vez sobre /api (health y auth ya quedaron registrados
// arriba, asi que no los alcanza). Montarlo por router repetiria la validacion
// —y su consulta a la base— en cada prefijo que comparte ruta.
app.use('/api', verifyJWT);

// Cada router aplica ademas requireRole() en sus rutas de escritura.
app.use('/api/proyectos', proyectosRouter);
app.use('/api/proyectos', planificacionRouter);   // /:proyectoId/planificacion
app.use('/api/proyectos', obraRouter);            // asistencias, incidencias, docs, materiales, etc.
app.use('/api/planificacion', avancesRouter);     // /:planId/avances y /avance/:id
app.use('/api/planificacion', etapasRouter);      // /:planId/etapas y /etapa/:id
app.use('/api/materiales', materialesRouter);     // catalogo global de materiales
app.use('/api/reportes', reportesRouter);         // reportes con flujo de aprobacion
app.use('/api/maquinaria', maquinariaRouter);     // equipos, registros, fallas (RF23-28)
app.use('/api/analisis', analisisRouter);         // resumen de proyectos (RF11, RF13)
app.use('/api/usuarios', usuariosRouter);         // gestion de cuentas y roles (HU16)

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

export default app;
