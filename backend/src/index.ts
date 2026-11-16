/*
 * Name:         index.ts
 * Description:  Entry point: loads .env and starts the StyleView backend.
 * Programmer:   Caleb Hite
 * Created:      2026-11-16
 * Revisions:    2026-11-16  Initial version (Sprint 2).
 * Preconditions:  Optional backend/.env (see .env.example).
 * Postconditions: Listens on PORT (default 3001) on all interfaces.
 * Errors:       Port already in use -> process exits with Node's error.
 */
import 'dotenv/config';
import { createApp } from './app.js';

const origins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:8081').split(',').map((s) => s.trim());
const port = Number(process.env.PORT ?? 3001);

createApp(origins).listen(port, '0.0.0.0', () => console.log(`StyleView backend listening on :${port} (all interfaces)`));
