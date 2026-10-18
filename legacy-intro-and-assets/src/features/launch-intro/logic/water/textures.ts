import { mulberry32 } from "@/utils/random/mulberry32";
import { clamp01 } from "../ease";
import { WORD } from "../wordmark";
import { clearAt } from "./pool";
import type { WaterScene } from "./scene";
import type { WaterSettings } from "./settings";

/** A soft bump in a tileable field: where it is and how big (0–1 of the tile), how high, its colour. */
export type Bump = { x: number; y: number; r: number; h: number; k: number };

/** The seed the prototype's textures were drawn with. */
const TEXTURE_SEED = 2718;

/**
 * The unevenness of the water's textures, drawn once from a fixed sequence (the
 * prototype's): what bends the caustic web's space (`bendU`, `bendV`), where its
 * light is calm and where bright (`calm`), and the patches of refracted colour.
 */
export const TEXTURE_BUMPS = (() => {
  const rnd = mulberry32(TEXTURE_SEED);
  const bumps = (count: number, rMin: number, rMax: number): Bump[] =>
    Array.from({ length: count }, () => ({
      x: rnd(),
      y: rnd(),
      r: rMin + (rMax - rMin) * rnd(),
      h: 0.4 + 0.6 * rnd(),
      k: Math.floor(rnd() * 4),
    }));
  const bendU = bumps(9, 0.12, 0.3);
  const bendV = bumps(9, 0.12, 0.3);
  const calm = bumps(7, 0.14, 0.32);
  const patches = bumps(16, 0.07, 0.2);
  return { bendU, bendV, calm, patches };
})();

/** One texture laid over the water: a tile `w`×`h` repeating from (x, y). */
export type Tile = { x: number; y: number; w: number; h: number };

/** `v` wrapped within `size`, so a tile starting there repeats without a gap. */
function wrap(v: number, size: number): number {
  "worklet";
  return ((v % size) + size) % size;
}

/** A drift that wanders — easing faster and slower, turning a little — never a steady slide. */
function wander(t: number, rate: number, amp: number, f: number, ph: number): number {
  "worklet";
  return rate * t + amp * Math.sin(t * f + ph);
}

/**
 * Where the pool's textures lie at `t`, in points from the screen's corner: two
 * caustic webs drifting apart, the calm field, the colour patches and the
 * bending field slower — all carried by the water's own movement (up with the
 * eruption, down with the drain) and stretched tall while it surges.
 */
export function poolTiles(scene: WaterScene, t: number) {
  "worklet";
  const { splash, hold, drain } = scene.beats;
  const up = clamp01((t - splash.start) / splash.dur);
  const down = clamp01((t - drain.start) / drain.dur);
  const flow =
    (scene.stage.height / 844) * (-1100 * (1 - (1 - up) * (1 - up)) + 1300 * down * down);
  const surge = Math.sin(Math.PI * clamp01((t - splash.start) / (splash.dur + hold.dur)));
  const tall = 1 + 0.75 * surge;
  const tile = (w: number, h: number, dx: number, dy: number): Tile => ({
    x: -120 + wrap(dx, w),
    y: -120 + wrap(dy, h),
    w,
    h,
  });
  return {
    causticA: tile(
      223,
      223 * tall,
      wander(t, 0.021, 26, 0.0011, 0.4),
      wander(t, -0.013, 22, 0.0009, 2.1) + flow,
    ),
    causticB: tile(
      307,
      307 * tall,
      wander(t, -0.016, 30, 0.0008, 1.3),
      wander(t, 0.009, 24, 0.0012, 4.0) + flow * 0.8,
    ),
    field: tile(
      290,
      290,
      wander(t, 0.006, 34, 0.0006, 3.1),
      wander(t, -0.004, 28, 0.0007, 0.9) + flow * 0.7,
    ),
    tint: tile(
      300,
      300,
      wander(t, 0.008, 30, 0.0007, 5.0),
      wander(t, -0.005, 26, 0.0005, 1.7) + flow * 0.6,
    ),
    warp: tile(
      300,
      300,
      wander(t, -0.011, 20, 0.0009, 2.6),
      wander(t, 0.007, 18, 0.001, 3.3) + flow * 0.7,
    ),
  };
}

/**
 * How much of the pool's living body shows at `t`: none in the red pool, coming
 * in as it clears; then the Water body setting — the light in proportion, the
 * colour paler or stronger with it, the glints falling away faster so they're
 * smaller and rarer when it's turned down.
 */
export function poolLight(scene: WaterScene, t: number) {
  "worklet";
  const clear = clearAt(scene.world, t);
  const body = scene.settings.waterBody * clear;
  return { clear, body, causticA: 0.55 * body, causticB: 0.35 * body, glints: 3.2 * body * body };
}

/**
 * Where letter `li`'s textures lie at `t`, in its own units from the corner of
 * its region: finer than the pool's, for a letter's strokes, each letter's
 * drifting on its own.
 */
export function letterTiles(li: number, t: number, region: { x: number; y: number }) {
  "worklet";
  const drift = (rate: number, amp: number, f: number, ph: number) =>
    wander(t, rate, amp, f, ph + li);
  const tile = (size: number, dx: number, dy: number): Tile => ({
    x: region.x + wrap(dx, size),
    y: region.y + wrap(dy, size),
    w: size,
    h: size,
  });
  return {
    causticA: tile(1.7, drift(0.00055, 0.12, 0.0011, 0.4), drift(-0.0004, 0.1, 0.0009, 2.1)),
    causticB: tile(2.05, drift(-0.00045, 0.14, 0.0008, 1.3), drift(0.0003, 0.11, 0.0012, 4.0)),
    field: tile(1.5, drift(0.0002, 0.16, 0.0006, 3.1), drift(-0.00015, 0.13, 0.0007, 0.9)),
    tint: tile(1.6, drift(0.00025, 0.14, 0.0007, 5.0), drift(-0.0002, 0.12, 0.0005, 1.7)),
    warp: tile(1.5, drift(-0.0003, 0.1, 0.0009, 2.6), drift(0.0002, 0.09, 0.001, 3.3)),
  };
}

/**
 * The gleam: a soft band of light sweeping across the whole word every 2.4
 * seconds, taking one to cross — where its middle is, in the word's units, and
 * how strong it is (none between sweeps).
 */
export function gleamAt(t: number, gleam: number) {
  "worklet";
  const phase = t < 700 ? -1 : ((t - 700) % 2400) / 1000;
  const on = phase >= 0 && phase <= 1;
  return { centre: -3 + phase * (WORD.width + 6), strength: on ? 0.7 * gleam : 0 };
}

/**
 * How the pool's living water shows inside the letters, from the settings:
 * stronger than the pool's, because a letter's strokes are thin and these have
 * to read in them.
 */
export function letterLight(settings: WaterSettings) {
  "worklet";
  const like = settings.textWaterLikeness;
  const shine = settings.textWaterShine;
  const color = settings.textWaterColor;
  return {
    deep: Math.min(1, 0.55 * like),
    causticA: 0.6 * like,
    causticB: 0.4 * like,
    tint: 1.8 * color,
    bands: 1.5 * color,
    sheen: 0.9 * shine,
    spark: 3.5 * shine * shine,
  };
}
