/*
 * Name:         upload.ts
 * Description:  Multer configuration for shirt photo uploads. Files are held in
 *               memory only (never written to disk) and capped at 10 MB.
 * Programmer:   Caleb Hite
 * Created:      2026-11-16
 * Revisions:    2026-11-16  Initial version (Sprint 2 req. 13).
 * Preconditions:  Request is multipart/form-data with a single field named "image".
 * Postconditions: `req.file.buffer` holds the uploaded bytes.
 * Errors:       Files over the limit cause a MulterError (handled in errors.ts).
 */
import multer from 'multer';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});
