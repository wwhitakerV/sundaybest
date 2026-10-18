import { clamp01 } from "../ease";

/**
 * The pool pouring in at the start: `ms` long, to `depth` points deep, across a
 * screen `width` points wide whose positions scale by `sx` from the prototype's.
 */
export type Pour = { ms: number; depth: number; width: number; sx: number };

/** How much of the pool has poured in by `t`: 0 to 1, quick at first, easing in. */
export function pourIn(pour: Pour, t: number): number {
  "worklet";
  const p = clamp01(t / pour.ms);
  return 1 - (1 - p) * (1 - p) * (1 - p);
}

/**
 * How far the poured-in water has reached at x: 0 ahead of its rounded front, 1
 * behind it. The front runs from past the right edge to past the left one in
 * the first 55% of the pour.
 */
export function pourReached(pour: Pour, x: number, t: number): number {
  "worklet";
  const { width: W, sx } = pour;
  const run = clamp01(t / (pour.ms * 0.55));
  const front = W + 40 * sx - (W + 120 * sx) * (1 - (1 - run) * (1 - run));
  const ahead = clamp01((x - front) / (46 * sx));
  return ahead * ahead * (3 - 2 * ahead);
}

/** When the pour's front runs into the left wall: just after its leading edge touches it. */
export function wallHitAt(pour: Pour): number {
  "worklet";
  return pour.ms * 0.55 * (1 - Math.sqrt(60 / 510));
}

/**
 * The pour's front hitting the left wall, as a height above the water at x. Its
 * momentum throws it up the wall — fast, then falling back under its own weight —
 * and the collapse sends a crest back across the pool that runs up the right
 * wall, rebounds, and dies away.
 */
export function wallSurge(pour: Pour, x: number, t: number): number {
  "worklet";
  const T = pour.ms;
  const { width: W, sx } = pour;
  const s = t - wallHitAt(pour);
  if (s <= 0) return 0;
  // Fades out before the pour's shape hands back to the plain pool.
  const fade = 1 - clamp01((t - T * 2.6) / (T * 0.6));
  // The run-up: climbs the wall, peaks, falls back.
  const up = T * 0.1;
  const climb = (s / up) * Math.exp(1 - s / up);
  const runUp = 2.4 * pour.depth * climb * Math.exp(-((x / (38 * sx)) ** 2));
  // The rebound: a crest leaving the wall as the run-up falls, crossing in about half the
  // pour, reflected at each wall (mirror images, so it climbs the wall it meets).
  const r = s - up;
  let rebound = 0;
  if (r > 0) {
    const p = ((r * W) / (T * 0.55)) % (2 * W);
    const at = p > W ? 2 * W - p : p;
    const amp = 0.9 * pour.depth * Math.exp(-r / (T * 0.7)) * clamp01(r / (T * 0.08));
    const crest = (c: number) => Math.exp(-(((x - c) / (55 * sx)) ** 2));
    const going = p > W ? -1 : 1;
    rebound =
      amp * (crest(at) + crest(-at) + crest(2 * W - at)) - 0.3 * amp * crest(at - going * 90 * sx);
  }
  return (runUp + rebound) * fade;
}

/**
 * The pour's shape at x, as a change to the surface's height: the water comes in
 * at the bottom right and runs left along the bottom — nothing yet ahead of its
 * front — standing higher where it pours in; reaching the far wall, it slams
 * into it and rebounds (`wallSurge`), what's left of the slosh dying away.
 * −1 (just under the screen) before any has poured in.
 */
export function pouring(pour: Pour, x: number, t: number): number {
  "worklet";
  const T = pour.ms;
  if (t > T * 3.2) return 0;
  const filled = pourIn(pour, t) * pour.depth;
  if (filled <= 0) return -1;
  const run = clamp01(t / (T * 0.55));
  const reached = pourReached(pour, x, t);
  // Higher at the right while it pours in; then what's left of a slosh, dying away.
  const after = Math.max(0, t - T * 0.55);
  const lean =
    0.9 * (1 - run) + 0.3 * Math.exp(-after / (T * 0.55)) * Math.cos(after * (5.2 / T)) * run;
  const half = pour.width / 2;
  const tilt = lean * ((x - half) / half);
  // Its height here, minus the level the pool is drawn at: the difference is the shape.
  const here = filled * reached * (1 + tilt) + wallSurge(pour, x, t) * reached;
  return here - filled;
}
