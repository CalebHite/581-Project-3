/*
 * Name:         shirts.ts
 * Description:  Express routes for shirt pictures: validate, normalize, transform
 *               (crop/rotate), cutout (trace), and photo tips.
 * Programmer:   Caleb Hite
 * Created:      2026-11-16
 * Revisions:    2026-11-16  Initial version (Sprint 2 reqs. 13-17).
 * Preconditions:  Multipart uploads use the field name "image"; JSON options go in
 *                 a form field named "options".
 * Postconditions: Returns JSON (validate/tips) or image/png bytes; nothing is stored.
 * Errors:       Invalid input -> AppError (4xx) handled by errors.ts.
 */
import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errors.js';
import { upload } from '../middleware/upload.js';
import { cutoutImage, normalizeImage, transformImage, validateImage } from '../services/imageService.js';

export const shirts = Router();

export const TIPS = [
  'Lay the shirt flat on a plain, contrasting surface.',
  'Use bright, even light and avoid shadows.',
  'Take the picture straight from above with the whole shirt in view.',
  'Smooth out wrinkles and keep the shirt facing front.',
];

const cropSchema = z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() });
const transformSchema = z.object({
  rotate: z
    .number()
    .int()
    .refine((n) => n % 90 === 0, 'rotate must be a multiple of 90')
    .default(0),
  crop: cropSchema.optional(),
});
const cutoutSchema = z.object({
  polygon: z.array(z.object({ x: z.number(), y: z.number() })).min(3).max(500),
});

// Parse a JSON string field from multipart form data against a schema.
function parseField<T extends z.ZodTypeAny>(schema: T, raw: unknown): z.infer<T> {
  try {
    return schema.parse(raw ? JSON.parse(String(raw)) : {});
  } catch {
    throw new AppError(400, 'bad_request', 'The request was not valid. Please try again.');
  }
}

shirts.get('/tips', (_req, res) => {
  res.json({ tips: TIPS });
});

shirts.post('/validate', upload.single('image'), async (req, res, next) => {
  try {
    const { width, height } = await validateImage(req.file?.buffer);
    res.json({ ok: true, width, height });
  } catch (e) {
    next(e);
  }
});

shirts.post('/normalize', upload.single('image'), async (req, res, next) => {
  try {
    await validateImage(req.file?.buffer);
    res.type('png').send(await normalizeImage(req.file!.buffer));
  } catch (e) {
    next(e);
  }
});

shirts.post('/transform', upload.single('image'), async (req, res, next) => {
  try {
    const { rotate, crop } = parseField(transformSchema, req.body?.options);
    await validateImage(req.file?.buffer);
    res.type('png').send(await transformImage(req.file!.buffer, rotate, crop));
  } catch (e) {
    next(e);
  }
});

shirts.post('/cutout', upload.single('image'), async (req, res, next) => {
  try {
    const { polygon } = parseField(cutoutSchema, req.body?.options);
    await validateImage(req.file?.buffer);
    res.type('png').send(await cutoutImage(req.file!.buffer, polygon));
  } catch (e) {
    next(e);
  }
});
