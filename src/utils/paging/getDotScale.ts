/** A dot's size, by how many places it lies outside the window: full, two thirds, a third, gone. */
const SCALES = [1, 2 / 3, 1 / 3, 0] as const;

/**
 * How big dot `index` is drawn, the window of full dots starting at `start`
 * (it may be part-way, mid-slide) and `size` long: full inside it, smaller
 * the further past either end, gone three places out.
 */
export function getDotScale(index: number, start: number, size: number): number {
  "worklet";
  const out = Math.max(start - index, index - (start + size - 1), 0);
  const step = Math.min(Math.floor(out), SCALES.length - 1);
  const from = SCALES[step] ?? 0;
  const to = SCALES[Math.min(step + 1, SCALES.length - 1)] ?? 0;
  return from + (to - from) * (out - step);
}
