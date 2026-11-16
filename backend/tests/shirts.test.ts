/*
 * Name:         shirts.test.ts
 * Description:  Integration tests for the shirt picture routes.
 * Programmer:   Caleb Hite
 * Created:      2026-11-16
 * Revisions:    2026-11-16  Initial version (Sprint 2 reqs. 13-17).
 * Preconditions:  None; images are generated in memory.
 * Postconditions: Pass/fail per route behavior.
 * Errors:       N/A.
 */
import request from 'supertest';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const app = createApp(['http://localhost:8081']);
const img = (w: number, h: number) =>
  sharp({ create: { width: w, height: h, channels: 3, background: '#cc3333' } }).jpeg().toBuffer();

// Collect a binary response body.
const binary = (res: any, cb: (e: Error | null, b: Buffer) => void) => {
  const c: Buffer[] = [];
  res.on('data', (d: Buffer) => c.push(d));
  res.on('end', () => cb(null, Buffer.concat(c)));
};

describe('shirt routes', () => {
  it('health', async () => {
    expect((await request(app).get('/health')).body.ok).toBe(true);
  });
  it('tips', async () => {
    expect((await request(app).get('/api/shirts/tips')).body.tips.length).toBeGreaterThan(0);
  });
  it('accepts a valid image', async () => {
    const r = await request(app).post('/api/shirts/validate').attach('image', await img(400, 300), 'a.jpg');
    expect(r.body).toEqual({ ok: true, width: 400, height: 300 });
  });
  it('rejects non-images', async () => {
    const r = await request(app).post('/api/shirts/validate').attach('image', Buffer.from('hello'), 'a.txt');
    expect(r.status).toBe(415);
    expect(r.body.code).toBe('not_an_image');
  });
  it('rejects tiny images', async () => {
    const r = await request(app).post('/api/shirts/validate').attach('image', await img(50, 50), 'a.jpg');
    expect(r.body.code).toBe('too_small');
  });
  it('rejects missing file', async () => {
    expect((await request(app).post('/api/shirts/validate')).body.code).toBe('no_file');
  });
  it('rejects oversized files', async () => {
    const big = Buffer.alloc(11 * 1024 * 1024);
    const r = await request(app).post('/api/shirts/validate').attach('image', big, 'a.jpg');
    expect(r.status).toBe(413);
  });
  it('rotates and crops', async () => {
    const r = await request(app)
      .post('/api/shirts/transform')
      .field('options', JSON.stringify({ rotate: 90, crop: { x: 0, y: 0, w: 0.5, h: 1 } }))
      .attach('image', await img(400, 300), 'a.jpg')
      .buffer()
      .parse(binary);
    const m = await sharp(r.body).metadata();
    expect([m.width, m.height]).toEqual([150, 400]);
  });
  it('cuts out a polygon with transparency', async () => {
    const r = await request(app)
      .post('/api/shirts/cutout')
      .field('options', JSON.stringify({ polygon: [{ x: 0.2, y: 0.2 }, { x: 0.8, y: 0.2 }, { x: 0.5, y: 0.9 }] }))
      .attach('image', await img(400, 300), 'a.jpg')
      .buffer()
      .parse(binary);
    const { data, info } = await sharp(r.body).raw().toBuffer({ resolveWithObject: true });
    expect(data[3]).toBe(0); // corner transparent
    const mid = (Math.floor(info.height / 3) * info.width + Math.floor(info.width / 2)) * info.channels;
    expect(data[mid + 3]).toBe(255); // inside polygon opaque
  });
});
