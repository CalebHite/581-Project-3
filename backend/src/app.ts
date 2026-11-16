/*
 * Name:         app.ts
 * Description:  Builds the Express app: CORS allowlist, routes, error handler.
 * Programmer:   Caleb Hite
 * Created:      2026-11-16
 * Revisions:    2026-11-16  Initial version (Sprint 2).
 * Preconditions:  `allowedOrigins` lists the browser origins of the Expo web app.
 * Postconditions: Returns a configured app (not yet listening).
 * Errors:       Disallowed origins receive no CORS headers; see errors.ts for the rest.
 */
import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errors.js';
import { mediapipe } from './routes/mediapipe.js';
import { shirts } from './routes/shirts.js';

export function createApp(allowedOrigins: string[]) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: allowedOrigins }));
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/shirts', shirts);
  app.use('/mediapipe', mediapipe);
  app.use(errorHandler);
  return app;
}
