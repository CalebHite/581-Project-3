/*
 * Name:         shirtTransform.ts
 * Description:  Pure math that turns body landmarks into the on-screen placement
 *               (position, size, tilt) of a shirt picture, for the mirrored camera view.
 * Programmer:   Caleb Hite
 * Created:      2026-11-16
 * Revisions:    2026-11-16  Initial version (Sprint 2 reqs. 9, 10, 18, 20).
 * Preconditions:  Landmarks are normalized 0-1 in the un-mirrored video frame.
 *                 The video is shown with "cover" fit and mirrored left-right.
 * Postconditions: `placeShirt` returns a placement, or null when the shoulders are
 *                 not confidently visible. `smooth` blends placements to reduce jitter.
 * Errors:       None thrown; low-confidence or degenerate input returns null.
 */
import { Adjust, KeyPoints, NO_ADJUST } from '../types';

export type Landmark = { x: number; y: number; visibility?: number };

// Where to draw the shirt: top-left of the unrotated box, its size, tilt, and pivot.
export type Placement = {
  left: number;
  top: number;
  width: number;
  height: number;
  angleDeg: number;
  pivotX: number; // fraction of width (the shoulder midpoint)
  pivotY: number; // fraction of height
};

export type View = { width: number; height: number; videoWidth: number; videoHeight: number };

// MediaPipe pose landmark indices used here.
const L_SHOULDER = 11;
const R_SHOULDER = 12;
const L_HIP = 23;
const R_HIP = 24;
export const MIN_VISIBILITY = 0.5;

const visible = (p?: Landmark) => !!p && (p.visibility ?? 1) >= MIN_VISIBILITY;

// Map a landmark to screen pixels: undo "cover" cropping, then mirror horizontally.
export function toScreen(p: Landmark, v: View) {
  const s = Math.max(v.width / v.videoWidth, v.height / v.videoHeight);
  const offX = (v.width - v.videoWidth * s) / 2;
  const offY = (v.height - v.videoHeight * s) / 2;
  return { x: v.width - (p.x * v.videoWidth * s + offX), y: p.y * v.videoHeight * s + offY };
}

export function placeShirt(
  lm: Landmark[] | undefined,
  view: View,
  shirt: { width: number; height: number; keyPoints: KeyPoints },
  adjust: Adjust = NO_ADJUST,
): Placement | null {
  if (!lm || view.videoWidth === 0 || view.videoHeight === 0) return null;
  if (!visible(lm[L_SHOULDER]) || !visible(lm[R_SHOULDER])) return null;

  // Block: shoulder points on screen, ordered left to right as the user sees them.
  const a = toScreen(lm[L_SHOULDER], view);
  const b = toScreen(lm[R_SHOULDER], view);
  const [pl, pr] = a.x <= b.x ? [a, b] : [b, a];
  const shoulderW = Math.hypot(pr.x - pl.x, pr.y - pl.y);
  if (shoulderW < 10) return null;
  const mid = { x: (pl.x + pr.x) / 2, y: (pl.y + pr.y) / 2 };
  const angleDeg = (Math.atan2(pr.y - pl.y, pr.x - pl.x) * 180) / Math.PI;

  // Block: scale. Width comes from the shoulder seams; if the hips are visible the
  // hem-to-shoulder length refines it (shirt should end a bit below the hips).
  const { leftShoulder: ls, rightShoulder: rs, hem } = shirt.keyPoints;
  const seamFrac = Math.abs(rs.x - ls.x) || 0.5;
  let k = shoulderW / (seamFrac * shirt.width);
  if (visible(lm[L_HIP]) && visible(lm[R_HIP])) {
    const hipA = toScreen(lm[L_HIP], view);
    const hipB = toScreen(lm[R_HIP], view);
    const torso = Math.hypot((hipA.x + hipB.x) / 2 - mid.x, (hipA.y + hipB.y) / 2 - mid.y);
    const hemLen = (hem.y - (ls.y + rs.y) / 2) * shirt.height;
    if (hemLen > 1 && torso > 10) k = 0.7 * k + 0.3 * ((torso * 1.25) / hemLen);
  }
  k *= adjust.scale;

  // Block: anchor the shirt's shoulder midpoint on the body's shoulder midpoint.
  const pivotX = (ls.x + rs.x) / 2;
  const pivotY = (ls.y + rs.y) / 2;
  const width = shirt.width * k;
  const height = shirt.height * k;
  return {
    left: mid.x + adjust.dx - pivotX * width,
    top: mid.y + adjust.dy - pivotY * height,
    width,
    height,
    angleDeg,
    pivotX,
    pivotY,
  };
}

// Exponential smoothing between the previous and next placement (alpha 0-1).
export function smooth(prev: Placement | null, next: Placement, alpha = 0.5): Placement {
  if (!prev) return next;
  const mix = (a: number, b: number) => a + (b - a) * alpha;
  return {
    left: mix(prev.left, next.left),
    top: mix(prev.top, next.top),
    width: mix(prev.width, next.width),
    height: mix(prev.height, next.height),
    angleDeg: mix(prev.angleDeg, next.angleDeg),
    pivotX: next.pivotX,
    pivotY: next.pivotY,
  };
}
