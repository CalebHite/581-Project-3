import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const app = createApp(['http://localhost:8081']);

describe('scan service', () => {
  it('health', async () => {
    expect((await request(app).get('/health')).body.ok).toBe(true);
  });

  it('status', async () => {
    const body = (await request(app).get('/api/scan/status')).body;
    expect(body.ok).toBe(true);
    expect(body.minPhotos).toBeGreaterThanOrEqual(10);
    expect(typeof body.cli).toBe('string');
  });

  it('reconstruct requires photos', async () => {
    const r = await request(app).post('/api/scan/reconstruct/base64').send({ images: [] });
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('NO_PHOTOS');
  });
});