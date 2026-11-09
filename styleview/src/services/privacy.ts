import { Platform } from 'react-native';

// Camera frames never leave the device: in production builds on the web, a
// Content Security Policy limits network connections to the app's own origin.
export function applyNetworkRestriction() {
  if (Platform.OS !== 'web' || __DEV__ || typeof document === 'undefined') return;
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content =
    "default-src 'self'; connect-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; " +
    "script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:";
  document.head.prepend(meta);
}
