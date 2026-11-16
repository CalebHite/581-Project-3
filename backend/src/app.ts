import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errors.js';
import { scan } from './routes/scan.js';

export function createApp(allowedOrigins: string[]) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: allowedOrigins }));
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/scan', scan);
  app.use(errorHandler);
  return app;
}