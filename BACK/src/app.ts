import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRouter from './routes/auth';
import proyectosRouter from './routes/proyectos';
import planificacionRouter from './routes/planificacion';
import avancesRouter from './routes/avances';
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

// Health-check: lo usan las plataformas de hosting para saber si el servicio esta vivo.
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);                 // /login, /register, /me
app.use('/api/proyectos', proyectosRouter);
app.use('/api/proyectos', planificacionRouter);   // /:proyectoId/planificacion
app.use('/api/planificacion', avancesRouter);     // /:planId/avances y /avance/:id

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

export default app;
