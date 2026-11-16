/*
 * Name:         config.ts
 * Description:  App-wide configuration: the base URL of the StyleView backend.
 * Programmer:   Caleb Hite
 * Created:      2026-11-16
 * Revisions:    2026-11-16  Initial version (Sprint 2 backend connection).
 * Preconditions:  Optionally set EXPO_PUBLIC_API_URL (e.g. http://192.168.1.5:3001).
 * Postconditions: Exports `API_URL` with no trailing slash.
 * Errors:       None; falls back to http://localhost:3001.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');
