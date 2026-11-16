/*
 * Name:         errors.ts
 * Description:  AppError type plus the central Express error handler, so every
 *               failure is returned as { ok:false, code, message }.
 * Programmer:   Caleb Hite
 * Created:      2026-11-16
 * Revisions:    2026-11-16  Initial version (Sprint 2 req. 14).
 * Preconditions:  Registered after all routes.
 * Postconditions: Sends a JSON error with a friendly message and HTTP status.
 * Errors:       Unknown errors become a generic 500 without leaking details.
 */
import type { ErrorRequestHandler } from 'express';
import multer from 'multer';

export class AppError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Block: our own validation failures.
  if (err instanceof AppError) {
    res.status(err.status).json({ ok: false, code: err.code, message: err.message });
    return;
  }
  // Block: upload failures (too large, unexpected field).
  if (err instanceof multer.MulterError) {
    const tooBig = err.code === 'LIMIT_FILE_SIZE';
    res.status(tooBig ? 413 : 400).json({
      ok: false,
      code: tooBig ? 'too_large' : 'bad_upload',
      message: tooBig
        ? 'That picture is too large. Please use one under 10 MB.'
        : 'Upload failed. Please try again.',
    });
    return;
  }
  console.error('Unhandled error:', err?.message);
  res
    .status(500)
    .json({ ok: false, code: 'server_error', message: 'Something went wrong. Please try again.' });
};
