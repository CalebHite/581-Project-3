/**
 * Production web CSP: allow connections to the scan backend and local blobs only.
 */
import { Platform } from 'react-native';
import { API_URL } from '../config';

export function applyNetworkRestriction() {
  if (Platform.OS !== 'web' || __DEV__ || typeof document === 'undefined') return;

  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content =
    `default-src 'self'; connect-src 'self' ${API_URL} data: blob:; img-src 'self' data: blob:; ` +
    "media-src 'self' blob:; worker-src 'self' blob:; " +
    `script-src 'self' ${API_URL} 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:`;

  document.head.prepend(meta);
}