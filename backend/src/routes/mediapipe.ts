/*
 * Name:         mediapipe.ts
 * Description:  Serves the on-device body-tracking files (MediaPipe bundle, wasm,
 *               pose model) so the app does not download ~20 MB through the slow
 *               Expo dev server on every reload. The tracking itself still runs in
 *               the user's browser; no video or pictures are received here.
 * Programmer:   Caleb Hite
 * Created:      2026-11-16
 * Revisions:    2026-11-16  Initial version (Sprint 2 req. 8).
 * Preconditions:  `npm install` has fetched @mediapipe/tasks-vision; the pose model
 *                 is in backend/assets/pose_landmarker_lite.task.
 * Postconditions: GET /mediapipe/loader.js, /mediapipe/vision_bundle.mjs,
 *                 /mediapipe/wasm/*, /mediapipe/pose_landmarker_lite.task are served
 *                 with long-lived cache headers.
 * Errors:       Missing files return 404 from express.static.
 */
import express, { Router } from 'express';
import { fileURLToPath } from 'node:url';

export const mediapipe = Router();

const visionDir = fileURLToPath(new URL('../../node_modules/@mediapipe/tasks-vision', import.meta.url));
const assetsDir = fileURLToPath(new URL('../../assets', import.meta.url));

// Tiny module that loads the bundle from this origin and hands it to the app.
mediapipe.get('/loader.js', (_req, res) => {
  res
    .type('application/javascript')
    .set('Cache-Control', 'public, max-age=3600')
    .send(
      "import * as vision from './vision_bundle.mjs';\n" +
        'window.__mediapipeVision = vision;\n' +
        "window.dispatchEvent(new Event('mediapipe-ready'));\n",
    );
});

const opts = { maxAge: '7d', immutable: true, index: false, dotfiles: 'ignore' as const };
mediapipe.use(express.static(visionDir, opts));
mediapipe.use(express.static(assetsDir, opts));
