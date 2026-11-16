/*
 * Name:         api.ts
 * Description:  Typed client for the StyleView backend's shirt-picture endpoints.
 *               Only still shirt pictures are sent; live video never is.
 * Programmer:   Caleb Hite
 * Created:      2026-11-16
 * Revisions:    2026-11-16  Initial version (Sprint 2 reqs. 13-17).
 * Preconditions:  Backend reachable at API_URL; `uri` points to an image
 *                 (data:, blob:, http(s): or a native file URI).
 * Postconditions: Returns data: URIs for processed images so they work on web and native.
 * Errors:       Throws ApiError with a user-friendly message on validation failures,
 *               timeouts, or an unreachable backend.
 */
import { Platform } from 'react-native';
import { API_URL } from '../config';
import { Point } from '../types';

export class ApiError extends Error {
  constructor(message: string, public code = 'api_error') {
    super(message);
  }
}

const TIMEOUT_MS = 30000;

// Block: turn any image URI into a form-data part (a Blob on web, a file ref on native).
async function appendImage(form: FormData, uri: string) {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append('image', blob, 'shirt.png');
  } else {
    form.append('image', { uri, name: 'shirt.png', type: 'image/png' } as any);
  }
}

// Block: read a Blob into a data: URI (URL.createObjectURL does not exist on native).
function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new ApiError('Could not read the processed picture.'));
    reader.readAsDataURL(blob);
  });
}

// Block: POST an image (plus optional JSON options) and return the raw Response.
async function post(path: string, uri: string, options?: unknown): Promise<Response> {
  const form = new FormData();
  await appendImage(form, uri);
  if (options !== undefined) form.append('options', JSON.stringify(options));

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method: 'POST', body: form, signal: ctrl.signal });
  } catch (e: any) {
    throw new ApiError(
      e?.name === 'AbortError'
        ? 'The server took too long to respond. Please try again.'
        : 'Could not reach the StyleView server. Check that it is running and try again.',
      'network',
    );
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    // Backend errors are { ok:false, code, message }.
    let body: any = null;
    try {
      body = await res.json();
    } catch {}
    throw new ApiError(body?.message ?? 'The server could not process that picture.', body?.code);
  }
  return res;
}

// Req. 14: throws ApiError with a readable reason if the picture can't be used.
export async function validateShirt(uri: string): Promise<{ width: number; height: number }> {
  const body = await (await post('/api/shirts/validate', uri)).json();
  return { width: body.width, height: body.height };
}

// Fix orientation and shrink the picture; returns a data: URI.
export async function normalizeShirt(uri: string): Promise<string> {
  return blobToDataUri(await (await post('/api/shirts/normalize', uri)).blob());
}

// Req. 16: rotate by a multiple of 90 degrees and/or crop (normalized 0-1 rectangle).
export async function transformShirt(
  uri: string,
  opts: { rotate?: number; crop?: { x: number; y: number; w: number; h: number } },
): Promise<string> {
  return blobToDataUri(await (await post('/api/shirts/transform', uri, opts)).blob());
}

// Req. 17: keep only the area inside the traced polygon (normalized 0-1 points).
export async function cutoutShirt(uri: string, polygon: Point[]): Promise<string> {
  return blobToDataUri(await (await post('/api/shirts/cutout', uri, { polygon })).blob());
}

// Req. 15: photo tips from the server, with a built-in fallback if it is unreachable.
export const FALLBACK_TIPS = [
  'Lay the shirt flat on a plain, contrasting surface.',
  'Use bright, even light and avoid shadows.',
  'Take the picture straight from above with the whole shirt in view.',
  'Smooth out wrinkles and keep the shirt facing front.',
];

export async function fetchTips(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/api/shirts/tips`);
    const body = await res.json();
    return Array.isArray(body.tips) ? body.tips : FALLBACK_TIPS;
  } catch {
    return FALLBACK_TIPS;
  }
}
