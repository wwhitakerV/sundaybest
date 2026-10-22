/**
 * The 99's small maths: a seeded random number, and the helpers the rules
 * share. Worklets, each calling only what's above it.
 */

/** The next number from a seeded generator (mulberry32), and its new state. */
export function nextRandom(state: number): { value: number; state: number } {
  "worklet";
  const next = (state + 0x6d2b79f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, state: next };
}

/** A value held between two others. */
export function clamp(value: number, least: number, most: number): number {
  "worklet";
  return Math.max(least, Math.min(most, value));
}

/** From one value to another, `t` of the way (held to 0–1). */
export function mix(a: number, b: number, t: number): number {
  "worklet";
  return a + (b - a) * clamp(t, 0, 1);
}
