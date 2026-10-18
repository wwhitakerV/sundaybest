import { clamp01 } from "../ease";
import type { Fall } from "../world-types";

/**
 * How far a falling letter has melted, and the melt's settings for this moment,
 * in the letter's own units (one is about 11pt). It melts as water does under
 * gravity: drawn out downward into streams, thinning sideways, and breaking along
 * them into separate drops — nothing swells.
 */
export type Melt = {
  melting: boolean;
  /** How far it's gone: none as it lets go, all of it as it lands. */
  m: number;
  /** How much of it is streams rather than the letter as it was. */
  shaped: number;
  /** How far its streams trail below it. */
  stretch: number;
  /** How much its outline wobbles. */
  bend: number;
  /** How much it thins sideways. */
  thin: number;
  /** Where the streams break into drops: higher, more gaps. */
  cut: number;
  /** How far the breaks have slid down the streams. */
  slide: number;
  /** How round its drops are, along the streams. */
  soft: number;
  /** Its wobble drifting, so the outline is never still. */
  driftX: number;
  driftY: number;
};

/**
 * Letter `li`'s melt at `t`, with the Melt setting `k`: it sets how soon it melts
 * (higher, sooner) and how far — how long its streams stretch, how thin they
 * draw, how much they break into drops.
 */
export function meltAt(k: number, fall: Fall, li: number, t: number): Melt {
  "worklet";
  const s = t - fall.start;
  const melting = k > 0 && s > 0 && t < fall.gone;
  const m = melting ? clamp01(s / Math.max(1, fall.hit - fall.start)) ** (0.8 / k) : 0;
  return {
    melting,
    m,
    shaped: Math.min(1, m * 1.25),
    stretch: 3.2 * m * k,
    bend: 0.18 * m,
    thin: 0.07 * m * k,
    cut: -3 + 6.2 * Math.min(1, m * k),
    slide: -(Math.max(0, s) * 0.0035) % 8,
    soft: 0.09 + 0.12 * m,
    driftX: 0.25 * Math.sin(t * 0.009 + li),
    driftY: 0.25 * Math.cos(t * 0.007 + li * 1.7),
  };
}

/**
 * A letter part-way melted, for the blank beat before the intro starts: drawn
 * where nothing shows, so the melt's filter is put to work before the letters
 * let go, not on their first frame falling.
 */
export function warmMelt(k: number): Melt {
  "worklet";
  return meltAt(k, { start: 0, hit: 1000, gone: 2000, rot: 0, cx: 0, x: 0 }, 0, 500);
}
