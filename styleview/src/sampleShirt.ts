/*
 * Name:         sampleShirt.ts
 * Description:  The bundled sample shirt shown before the user adds their own.
 * Programmer:   Caleb Hite
 * Created:      2026-11-16
 * Revisions:    2026-11-16  Initial version (Sprint 2 req. 9).
 * Preconditions:  assets/sample-shirt.png exists (600x600 transparent PNG).
 * Postconditions: Exports `SAMPLE_SHIRT` with matching default key points.
 * Errors:       None at runtime; a missing asset fails at bundle time.
 */
import { DEFAULT_KEYPOINTS, Shirt } from './types';

export const SAMPLE_SHIRT: Shirt = {
  uri: require('../assets/sample-shirt.png'),
  width: 600,
  height: 600,
  keyPoints: DEFAULT_KEYPOINTS,
};
