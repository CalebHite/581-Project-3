/*
 * Name:         theme.ts
 * Description:  Shared design constants (colors and touch-target size) used by
 *               every screen and component so the UI stays consistent.
 * Programmer:   Caleb Hite
 * Created:      2026-11-09
 * Revisions:    2026-11-09  Initial version (Sprint 1, req. 1 mobile-friendly UI).
 * Preconditions:  None; this module has no dependencies and no side effects.
 * Postconditions: Exports `colors` and `TOUCH`; values are never mutated.
 * Errors:       None possible; the module only declares constants.
 */

// Dark palette chosen for readability over a live camera feed.
export const colors = {
  bg: '#0f1115',
  card: '#1b1e26',
  text: '#f4f5f7',
  muted: '#a3a9b7',
  accent: '#7c5cff',
  danger: '#ff6b6b',
};

// Minimum touch target (in px) recommended for phone controls.
export const TOUCH = 48;
