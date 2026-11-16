/** Backend base URL for scan APIs (`EXPO_PUBLIC_API_URL` or Expo debugger host + :3001). */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function saneEnvUrl(): string | undefined {
  const raw = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/$/, '');
  if (!raw || raw.includes(',')) return undefined;
  return raw;
}

function lanHostFromExpo(): string | undefined {
  const raw =
    Constants.expoGoConfig?.debuggerHost ??
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri;
  if (typeof raw !== 'string' || !raw) return undefined;
  return raw.split(':')[0];
}

function resolveApiUrl(): string {
  const env = saneEnvUrl();
  if (env && (Platform.OS === 'web' || !/localhost|127\.0\.0\.1/.test(env))) {
    return env;
  }
  const lan = lanHostFromExpo();
  if (lan) return `http://${lan}:3001`;
  return env ?? 'http://localhost:3001';
}

export const API_URL = resolveApiUrl();