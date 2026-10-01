/**
 * A value held to 0–1: below it, 0; above it, 1. A worklet, so it runs on
 * the UI thread with the animation.
 */
export function clampUnit(value: number): number {
  "worklet";
  return Math.min(1, Math.max(0, value));
}
