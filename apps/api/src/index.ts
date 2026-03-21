import express from 'express';
import pumpsRouter from './routes/pumps.js';
import materialsRouter from './routes/materials.js';
import certificationsRouter from './routes/certifications.js';
import componentsRouter from './routes/components.js';
import curvesRouter from './routes/curves.js';

const app = express();
const PORT = process.env.API_PORT ? parseInt(process.env.API_PORT) : 3001;

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

// --- Error handling middleware ---
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Magnum Opus API running on http://localhost:${PORT}`);
});

export default app;
