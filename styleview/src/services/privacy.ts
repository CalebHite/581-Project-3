/*
 * Name:         privacy.ts
 * Description:  Enforces the "video never leaves the phone" rule by installing a
 *               Content Security Policy (CSP) that blocks network connections to
 *               anything except the app's own origin.
 * Programmer:   Caleb Hite
 * Created:      2026-11-09
 * Revisions:    2026-11-09  Initial version (Sprint 1, req. 6 no upload or save).
 * Preconditions:  Called once at startup, before any camera code runs.
 * Postconditions: On production web builds, a CSP <meta> tag is the first child of
 *                 <head>. On native, in development, or without a DOM, nothing changes.
 * Errors:       No errors thrown. In development the CSP is skipped on purpose,
 *               because it would block the dev server's hot-reload connection.
 */
import { Platform } from 'react-native';

export function applyNetworkRestriction() {
  // Guard: CSP only applies to production web builds with a document.
  if (Platform.OS !== 'web' || __DEV__ || typeof document === 'undefined') return;

  // Build the policy: everything is limited to the app's own origin, plus
  // data:/blob: URLs for local images and the camera stream, and WebAssembly
  // for the tracking models planned in later sprints.
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content =
    "default-src 'self'; connect-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; " +
    "script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:";

  // Prepend so the policy is in place before other tags load resources.
  document.head.prepend(meta);
}
