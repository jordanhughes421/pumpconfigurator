import express from 'express';
import cors from 'cors';
import pumpsRouter from './routes/pumps.js';
import materialsRouter from './routes/materials.js';
import certificationsRouter from './routes/certifications.js';
import componentsRouter from './routes/components.js';
import curvesRouter from './routes/curves.js';
import projectsRouter from './routes/projects.js';
import configurationsRouter from './routes/configurations.js';
import motorsRouter from './routes/motors.js';
import baseplatesRouter from './routes/baseplates.js';
import geometryRouter from './routes/geometry.js';

const app = express();
const PORT = parseInt(process.env.PORT || process.env.API_PORT || '3001', 10);
const allowedOrigins = (process.env.WEB_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Requests without an Origin header (curl, health checks, server-to-server)
    // are not browser CORS requests and should be allowed.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
}));
app.use(express.json());

// --- Health ---
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Routes ---
app.use('/api/pumps', pumpsRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/certifications', certificationsRouter);
app.use('/api/components', componentsRouter);
app.use('/api/curves', curvesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/configurations', configurationsRouter);
app.use('/api/motors', motorsRouter);
app.use('/api/baseplates', baseplatesRouter);
app.use('/api/geometry', geometryRouter);

// --- Error handling middleware ---
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Magnum Opus API running on port ${PORT}`);
});

export default app;
