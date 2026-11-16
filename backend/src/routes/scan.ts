/*
 * Object Capture–style person scan: many photos in, USDZ model out (macOS PhotogrammetrySession).
 */
import express, { Router } from 'express';
import { createReadStream } from 'node:fs';
import { uploadScan } from '../middleware/uploadScan.js';
import {
  buildPhotogrammetryModel,
  buildPhotogrammetryModelFromBuffers,
  isMacOS,
  modelExists,
  photogrammetryCliPath,
} from '../services/photogrammetryMac.js';

export const scan = Router();

scan.get('/status', (_req, res) => {
  res.json({
    ok: true,
    macOS: isMacOS(),
    cli: photogrammetryCliPath(),
    minPhotos: 10,
    recommendedPhotos: 24,
  });
});

/** Mobile clients (Expo) send base64 JPEGs — avoids broken RN FormData.file parts. */
scan.post('/reconstruct/base64', express.json({ limit: '120mb' }), async (req, res, next) => {
  try {
    const images = req.body?.images;
    if (!Array.isArray(images) || images.length < 10) {
      return res.status(400).json({
        ok: false,
        code: 'NO_PHOTOS',
        message: 'Need at least 10 base64 JPEG strings in images[].',
      });
    }
    const buffers = images.map((s: string) => Buffer.from(s, 'base64'));
    const { id } = await buildPhotogrammetryModelFromBuffers(buffers);
    res.json({ ok: true, modelId: id, modelUrl: `/api/scan/models/${id}.usdz` });
  } catch (e) {
    next(e);
  }
});

scan.post('/reconstruct', uploadScan.array('photos', 48), async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) {
      return res.status(400).json({ ok: false, code: 'NO_PHOTOS', message: 'No photos uploaded.' });
    }
    const { id } = await buildPhotogrammetryModel(files);
    res.json({
      ok: true,
      modelId: id,
      modelUrl: `/api/scan/models/${id}.usdz`,
    });
  } catch (e) {
    next(e);
  }
});

scan.get('/models/:id.usdz', async (req, res, next) => {
  try {
    const id = req.params.id.replace(/\.usdz$/, '');
    const file = await modelExists(id);
    if (!file) return res.status(404).json({ ok: false, message: 'Model not found' });
    res.setHeader('Content-Type', 'model/vnd.usdz+zip');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    createReadStream(file).pipe(res);
  } catch (e) {
    next(e);
  }
});