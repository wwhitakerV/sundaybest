// The intro's small maths helpers, marked as worklets so its frames can be worked
// out on the UI thread as well as in tests.

/** `value` held to 0–1. */
export function clamp01(value: number): number {
  "worklet";
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/** Fast, then settling: a quadratic ease out. */
export function easeOut(p: number): number {
  "worklet";
  return 1 - (1 - p) * (1 - p);
}

/** Slow, fast, slow: a sine ease in and out, as a hand moves a pen. */
export function easeInOut(p: number): number {
  "worklet";
  return 0.5 - 0.5 * Math.cos(Math.PI * p);
}

/** Part way from `a` to `b`. */
export function mix(a: number, b: number, t: number): number {
  "worklet";
  return a + (b - a) * t;
}
