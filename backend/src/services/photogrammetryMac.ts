import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const nativeRoot = fileURLToPath(new URL('../../native', import.meta.url));

function defaultCliPath() {
  return path.join(nativeRoot, '.build', 'release', 'scan-reconstruct');
}

export function photogrammetryCliPath(): string {
  return process.env.PHOTOGRAMMETRY_CLI?.trim() || defaultCliPath();
}

export function isMacOS(): boolean {
  return process.platform === 'darwin';
}

export async function buildPhotogrammetryModelFromBuffers(buffers: Buffer[]): Promise<{ id: string; usdzPath: string }> {
  if (!isMacOS()) {
    throw new Error('Object Capture reconstruction requires the StyleView backend on macOS.');
  }
  if (buffers.length < 10) {
    throw new Error('Need at least 10 photos around the person (20+ recommended).');
  }

  const id = randomUUID();
  const work = path.join(tmpdir(), `styleview-scan-${id}`);
  const inputDir = path.join(work, 'images');
  const outFile = path.join(work, 'person.usdz');
  await mkdir(inputDir, { recursive: true });

  for (let i = 0; i < buffers.length; i++) {
    const name = `capture_${String(i).padStart(4, '0')}.jpg`;
    await writeFile(path.join(inputDir, name), buffers[i]);
  }

  const cli = photogrammetryCliPath();
  try {
    await execFileAsync(cli, [inputDir, outFile], {
      timeout: 20 * 60 * 1000,
      maxBuffer: 4 * 1024 * 1024,
    });
  } catch (e: any) {
    const hint = 'Build the CLI: cd backend/native && swift build -c release (macOS 13+, Xcode).';
    throw new Error(e?.stderr?.toString?.() || e?.message || `Photogrammetry failed. ${hint}`);
  }

  const modelsDir = path.join(homedir(), '.styleview', 'models');
  await mkdir(modelsDir, { recursive: true });
  const dest = path.join(modelsDir, `${id}.usdz`);
  await writeFile(dest, await readFile(outFile));

  await rm(work, { recursive: true, force: true });
  return { id, usdzPath: dest };
}

export async function buildPhotogrammetryModel(files: Express.Multer.File[]) {
  return buildPhotogrammetryModelFromBuffers(files.map((f) => f.buffer));
}

export async function modelExists(id: string): Promise<string | null> {
  const p = path.join(homedir(), '.styleview', 'models', `${id}.usdz`);
  const names = await readdir(path.dirname(p)).catch(() => []);
  if (!names.includes(`${id}.usdz`)) return null;
  return p;
}