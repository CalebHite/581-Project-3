/*
 * Name:         imageService.ts
 * Description:  Image processing for shirt pictures using sharp: validation,
 *               normalization, crop/rotate, and polygon cut-out. All in memory.
 * Programmer:   Caleb Hite
 * Created:      2026-11-16
 * Revisions:    2026-11-16  Initial version (Sprint 2 reqs. 13, 14, 16, 17).
 * Preconditions:  Inputs are raw image bytes; polygon/crop values are normalized 0-1.
 * Postconditions: Returns processed image buffers; inputs are never stored.
 * Errors:       Throws AppError with a user-friendly message for unusable pictures.
 */
import sharp, { type Metadata } from 'sharp';
import { AppError } from '../middleware/errors.js';

const ALLOWED = new Set(['jpeg', 'png', 'webp', 'heif']);
export const MIN_SIDE = 200;
export const MAX_SIDE = 1280;

export type Crop = { x: number; y: number; w: number; h: number };
export type Point = { x: number; y: number };

// Block: open the image and reject anything that is not a usable picture.
export async function validateImage(buf: Buffer | undefined) {
  if (!buf || buf.length === 0) {
    throw new AppError(400, 'no_file', 'No picture was received. Please choose a picture.');
  }
  let meta: Metadata;
  try {
    meta = await sharp(buf).metadata();
  } catch {
    throw new AppError(415, 'not_an_image', "That file isn't a picture we can read. Try a JPG or PNG.");
  }
  if (!meta.format || !ALLOWED.has(meta.format)) {
    throw new AppError(415, 'unsupported_type', 'Unsupported picture type. Please use JPG, PNG, or WebP.');
  }
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (Math.min(width, height) < MIN_SIDE) {
    throw new AppError(422, 'too_small', `That picture is too small. Use one at least ${MIN_SIDE}px on each side.`);
  }
  // Force a full decode so truncated/corrupt files are caught here.
  try {
    await sharp(buf).resize(8, 8).raw().toBuffer();
  } catch {
    throw new AppError(422, 'corrupt', 'That picture seems damaged. Please try another one.');
  }
  return { width, height };
}

// Block: fix phone orientation and shrink to a manageable size.
export async function normalizeImage(buf: Buffer) {
  await validateImage(buf);
  return sharp(buf)
    .rotate()
    .resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true })
    .png()
    .toBuffer();
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

// Block: rotate (multiples of 90) then crop with normalized coordinates.
export async function transformImage(buf: Buffer, rotate: number, crop?: Crop) {
  await validateImage(buf);
  // First rotate() applies EXIF orientation and flushes it before the manual turn.
  const oriented = await sharp(buf).rotate().png().toBuffer();
  const rotated = await sharp(oriented).rotate(rotate).png().toBuffer();
  if (!crop) return rotated;
  const { width = 0, height = 0 } = await sharp(rotated).metadata();
  const left = Math.min(width - 1, Math.round(clamp01(crop.x) * width));
  const top = Math.min(height - 1, Math.round(clamp01(crop.y) * height));
  const w = Math.max(1, Math.min(width - left, Math.round(clamp01(crop.w) * width)));
  const h = Math.max(1, Math.min(height - top, Math.round(clamp01(crop.h) * height)));
  if (w < 20 || h < 20) throw new AppError(422, 'crop_too_small', 'The crop area is too small.');
  return sharp(rotated).extract({ left, top, width: w, height: h }).png().toBuffer();
}

// Block: keep only the pixels inside the traced polygon; the rest become transparent.
export async function cutoutImage(buf: Buffer, polygon: Point[]) {
  await validateImage(buf);
  const base = await sharp(buf).rotate().png().toBuffer();
  const { width = 0, height = 0 } = await sharp(base).metadata();
  const pts = polygon.map((p) => `${clamp01(p.x) * width},${clamp01(p.y) * height}`).join(' ');
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      `<polygon points="${pts}" fill="#fff"/></svg>`,
  );
  return sharp(base).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}
