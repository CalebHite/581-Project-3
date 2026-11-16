/*
 * Name:         types.ts
 * Description:  Shared types for the try-on modes and shirts (picture + key points).
 * Programmer:   Caleb Hite
 * Created:      2026-11-09
 * Revisions:    2026-11-09  Initial version (Sprint 1, req. 7 mode selection).
 *               2026-11-16  Added Point, KeyPoints, Shirt, DEFAULT_KEYPOINTS (Sprint 2).
 * Preconditions:  None.
 * Postconditions: Exports types and constants; every Mode value has exactly one label.
 *                 Point coordinates are normalized 0-1 within the shirt image.
 * Errors:       None possible at runtime; invalid modes are rejected at compile time.
 */

// The two mutually exclusive try-on modes from the architecture document.
export type Mode = 'shirt' | 'hairstyle';

// User-facing text for each mode.
export const MODE_LABEL: Record<Mode, string> = {
  shirt: 'Shirts',
  hairstyle: 'Hairstyles',
};

// A position inside an image, as fractions of its width and height.
export type Point = { x: number; y: number };

// Marks that line a shirt up with the body: shoulder seams (left < right in x) and hem.
export type KeyPoints = { leftShoulder: Point; rightShoulder: Point; hem: Point };

// A shirt picture ready for try-on. `uri` may be an asset module id for the sample.
export type Shirt = { uri: string | number; width: number; height: number; keyPoints: KeyPoints };

// Key points matching the bundled sample shirt (assets/sample-shirt.png, 600x600).
export const DEFAULT_KEYPOINTS: KeyPoints = {
  leftShoulder: { x: 0.19, y: 0.17 },
  rightShoulder: { x: 0.81, y: 0.17 },
  hem: { x: 0.5, y: 0.95 },
};

// User adjustments applied on top of tracking (req. 20).
export type Adjust = { scale: number; dx: number; dy: number };
export const NO_ADJUST: Adjust = { scale: 1, dx: 0, dy: 0 };
