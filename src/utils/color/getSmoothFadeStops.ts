export type FadeStop = { offset: number; opacity: number };

/** Enough samples that the curve reads as a curve, not a series of ramps. */
const SAMPLES = 8;

/**
 * A fade from clear to shown as gradient stops, eased in and out
 * (smoothstep) rather than straight — a straight ramp shows a line where it
 * starts and where it ends.
 */
export function getSmoothFadeStops(): FadeStop[] {
  return Array.from({ length: SAMPLES + 1 }, (_, index) => {
    const offset = index / SAMPLES;
    return { offset, opacity: offset * offset * (3 - 2 * offset) };
  });
}
