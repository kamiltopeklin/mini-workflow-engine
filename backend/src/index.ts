import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { workflowRoutes } from './routes/workflows';
import { triggerRoutes } from './routes/trigger';
import { runRoutes } from './routes/runs';
import { initDatabase } from './db/init';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (_req, res) => {
  res.json({
    service: 'mini-workflow-engine',
    status: 'running',
  });
});

app.use('/api/workflows', workflowRoutes);
app.use('/api/runs', runRoutes);
app.use('/t', triggerRoutes);

// In production, serve frontend static files and SPA fallback
if (isProduction) {
  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  const status = (err as { status?: number })?.status || 500;
  const message = err instanceof Error ? err.message : 'Internal server error';
  const stack = err instanceof Error ? err.stack : undefined;
  
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && stack && { stack })
  });
});

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
