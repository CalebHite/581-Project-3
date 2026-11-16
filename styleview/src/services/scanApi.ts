import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { API_URL } from '../config';

export type ScanStatus = {
  ok: boolean;
  macOS: boolean;
  cli: string;
  minPhotos: number;
  recommendedPhotos: number;
};

export type ScanResult = {
  ok: boolean;
  modelId: string;
  modelUrl: string;
};

export async function fetchScanStatus(): Promise<ScanStatus> {
  const r = await fetch(`${API_URL}/api/scan/status`);
  if (!r.ok) throw new Error(`Could not reach scan service at ${API_URL}`);
  return r.json();
}

export async function reconstructPersonScan(photoUris: string[]): Promise<ScanResult> {
  if (Platform.OS === 'web') {
    const form = new FormData();
    const blobs = await Promise.all(
      photoUris.map(async (uri, i) => {
        const r = await fetch(uri);
        const b = await r.blob();
        return new File([b], `capture_${i}.jpg`, { type: b.type || 'image/jpeg' });
      }),
    );
    for (const f of blobs) form.append('photos', f);
    const r = await fetch(`${API_URL}/api/scan/reconstruct`, { method: 'POST', body: form });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.message ?? 'Reconstruction failed');
    return data;
  }

  const images = await Promise.all(
    photoUris.map((uri) =>
      FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }),
    ),
  );
  const r = await fetch(`${API_URL}/api/scan/reconstruct/base64`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.message ?? 'Reconstruction failed');
  return data;
}

export function modelAbsoluteUrl(modelUrl: string): string {
  if (modelUrl.startsWith('http')) return modelUrl;
  return `${API_URL}${modelUrl}`;
}