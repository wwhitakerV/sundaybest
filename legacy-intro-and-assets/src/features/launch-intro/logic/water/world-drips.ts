import { clamp01, mix } from "../ease";
import { GRAVITY, type Stage } from "../settings";
import type { StrokeTiming } from "../strokes";
import { BOTTOMS } from "../wordmark";
import type { Drip } from "../world-types";
import { surfaceLevel } from "./pool";
import type { Pour } from "./pour";
import type { WaterSettings } from "./settings";

/** A draw from the world's seeded sequence, between `a` and `b`. */
export type Draw = (a: number, b: number) => number;

/** Where the drips fall from and when the writing runs, in points and ms. */
type DripPlace = {
  toX: (u: number) => number;
  ws: number;
  yb: number;
  write: { start: number; dur: number };
  fallStart: number;
};

/** How long something falling from `y` takes to reach a surface at `surface`. */
export function fallTime(y: number, surface: number, g: number): number {
  return Math.sqrt((2 * Math.max(10, surface - y)) / g);
}

/**
 * Drips come from a few fixed spots on each letter's bottom edge, spaced so their
 * drops never overlap. Each spot drips one drop at a time, like a leaky tap,
 * faster and faster, from soon after the pen reaches it until the letters fall.
 */
function dripsFromLetters(
  settings: WaterSettings,
  strokes: readonly StrokeTiming[],
  place: DripPlace,
  r: Draw,
  rnd: () => number,
): Drip[] {
  const drips: Drip[] = [];
  const writing = (t: number) => clamp01((t - place.write.start) / place.write.dur);
  const minGap = Math.max(1, (2.6 * 8 * settings.dripSize) / place.ws);
  BOTTOMS.forEach((spans, li) => {
    const sites: number[] = [];
    for (const [a0, a1] of spans) {
      const n = Math.max(1, Math.min(3, Math.floor((a1 - a0) / minGap) + 1));
      for (let k = 0; k < n; k++) {
        const u = n === 1 ? r(a0, a1) : mix(a0, a1, (k + r(0.25, 0.75)) / n);
        if (sites.every((site) => Math.abs(site - u) >= minGap)) sites.push(u);
      }
    }
    const reached = strokes.find((stroke) => stroke.letter === li)?.start ?? 0;
    for (const site of sites) {
      let t = reached + r(200, 600);
      for (;;) {
        const hang = Math.max(40, settings.hangMs * r(0.75, 1.25));
        if (t + hang > place.fallStart) break;
        const rad = (r(3.2, 5) + 3 * writing(t)) * settings.dripSize;
        const td = t + hang;
        drips.push({
          tb: t,
          td,
          th: 0,
          x: place.toX(site),
          r: rad,
          satellite: rnd() < 0.35,
          kick: [],
        });
        const perSecond = 1.1 * settings.drips * (0.3 + 3 * writing(t) ** 2);
        t = td + Math.max(30, (1000 / perSecond - hang) * r(0.6, 1.4));
      }
    }
  });
  return drips;
}

/**
 * The drips, landed: each reaches the pool as high as it stands by then, and the
 * pool is sized so what has landed as the letters let go is a whole pool's worth.
 * Returns the drips in the order they let go, how much each unit of their volume
 * raises the pool, and when something falling from `y` at `t0` meets the water.
 */
export function landDrips(
  settings: WaterSettings,
  stage: Stage,
  strokes: readonly StrokeTiming[],
  place: DripPlace,
  pour: Pour,
  draw: { r: Draw; rnd: () => number },
) {
  const { height: H } = stage;
  const drips = dripsFromLetters(settings, strokes, place, draw.r, draw.rnd);
  drips.forEach((d) => {
    d.th = d.td + fallTime(place.yb + d.r * 3, H, GRAVITY.drip);
  });
  const byFall =
    drips.filter((d) => d.th <= place.fallStart).reduce((sum, d) => sum + d.r ** 3, 0) || 1;
  const poolH = pour.depth;
  const landed: Drip[] = [];
  const pool = {
    drips: landed,
    perVolume: poolH / byFall,
    pour,
    poolH,
    volumeFromDrip: settings.waterVolumeFromDrip,
  };
  const surface = (t: number) => surfaceLevel(pool, t);
  const landing = (t0: number, y: number, g: number) => {
    const first = t0 + fallTime(y, H - surface(t0 + 300), g);
    return t0 + fallTime(y, H - surface(first), g);
  };
  drips.sort((p, q) => p.td - q.td);
  for (const d of drips) {
    d.th = landing(d.td, place.yb + d.r * 3, GRAVITY.drip);
    landed.push(d);
  }
  // Each drip knocks a few small drops up out of the pool as it lands, like a coin into water.
  const { r, rnd } = draw;
  for (const d of drips) {
    const n = rnd() < 0.45 ? 1 : rnd() < 0.6 ? 2 : 3;
    d.kick = Array.from({ length: n }, (_, i) => ({
      vx: i === 0 ? r(-0.03, 0.03) : r(-0.13, 0.13),
      h: (i === 0 ? r(14, 30) : r(6, 18)) * Math.sqrt(settings.dripSize),
      r: d.r * (i === 0 ? r(0.45, 0.6) : r(0.28, 0.42)),
      delay: r(25, 55),
    }));
  }
  return { drips, perVolume: pool.perVolume, surface, landing };
}
