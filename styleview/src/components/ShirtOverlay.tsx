/*
 * Name:         ShirtOverlay.tsx
 * Description:  Draws a shirt picture over the camera at a computed placement.
 *               On the web it uses a plain <img> with a CSS transform, which is the
 *               most reliable way to paint a rotated picture over a <video>.
 * Programmer:   Caleb Hite
 * Created:      2026-11-16
 * Revisions:    2026-11-16  Initial version (Sprint 2 reqs. 9, 10, 11, 19, 20).
 *               2026-11-16  Made stateless: placement is computed by the parent so
 *                           no state updates happen inside effects.
 *               2026-11-16  Render with a DOM <img> instead of RN Image (shirt did
 *                           not paint); export shirtSource for debugging.
 * Preconditions:  `placement` comes from placeShirt (null when no body is tracked).
 *                 Web only (the tracker does not run on native).
 * Postconditions: Renders nothing when `placement` is null (shirt hidden while
 *                 tracking is lost); otherwise a rotated shirt image.
 * Errors:       A picture that fails to load is reported with console.error.
 */
import { createElement } from 'react';
import { Asset } from 'expo-asset';
import { Placement } from '../tracking/shirtTransform';
import { Shirt } from '../types';

type Props = { shirt: Shirt; placement: Placement | null };

// Turn a Shirt's picture (bundled asset id or URI) into a URL the browser can load.
export function shirtSource(shirt: Shirt): string {
  const u: any = shirt.uri;
  try {
    if (typeof u === 'string') return u;
    // Bundled asset: a module id (number) on most platforms...
    if (typeof u === 'number') return Asset.fromModule(u).uri;
    // ...or an object such as { uri }, { default } on web builds.
    if (u && typeof u === 'object') {
      if (typeof u.uri === 'string') return u.uri;
      if (typeof u.default === 'string') return u.default;
      if (u.default && typeof u.default.uri === 'string') return u.default.uri;
      return Asset.fromModule(u).uri;
    }
  } catch {}
  return '';
}

export function ShirtOverlay({ shirt, placement }: Props) {
  if (!placement) return null;
  const src = shirtSource(shirt);
  return createElement('img', {
    src,
    alt: '',
    draggable: false,
    onError: () => console.error('Shirt picture failed to load:', src.slice(0, 80)),
    style: {
      position: 'absolute',
      left: placement.left,
      top: placement.top,
      width: placement.width,
      height: placement.height,
      transformOrigin: `${placement.pivotX * 100}% ${placement.pivotY * 100}%`,
      transform: `rotate(${placement.angleDeg}deg)`,
      opacity: 0.95,
      pointerEvents: 'none',
      userSelect: 'none',
    },
  });
}
