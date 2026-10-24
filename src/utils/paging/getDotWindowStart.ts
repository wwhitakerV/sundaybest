/**
 * Where a carousel's window of full-sized dots starts, once page `active` is
 * in view — as Instagram's dots move: the dot in view moves within the
 * window, and the window moves only to keep it in, one dot at a time. `start`
 * is where it started before; `size` how many full dots it holds.
 */
export function getDotWindowStart(
  start: number,
  active: number,
  count: number,
  size: number,
): number {
  "worklet";
  const last = Math.max(0, count - size);
  const kept = Math.min(Math.max(start, active - size + 1), active);
  return Math.min(Math.max(kept, 0), last);
}
