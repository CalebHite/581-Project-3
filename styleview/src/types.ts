/*
 * Name:         types.ts
 * Description:  Shared types for the try-on modes (shirts vs. hairstyles).
 * Programmer:   Caleb Hite
 * Created:      2026-11-09
 * Revisions:    2026-11-09  Initial version (Sprint 1, req. 7 mode selection).
 * Preconditions:  None.
 * Postconditions: Exports the `Mode` type and the `MODE_LABEL` display names;
 *                 every Mode value has exactly one label.
 * Errors:       None possible at runtime; invalid modes are rejected at compile time.
 */

// The two mutually exclusive try-on modes from the architecture document.
export type Mode = 'shirt' | 'hairstyle';

// User-facing text for each mode.
export const MODE_LABEL: Record<Mode, string> = {
  shirt: 'Shirts',
  hairstyle: 'Hairstyles',
};
