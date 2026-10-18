import type { Tear } from "./frame-types";
import { levelAt } from "./pool";
import type { Scene } from "./scene";
import { GRAVITY } from "./settings";

/** A circle as a capsule: [centre x, top, bottom, width]. */
export function pushCircle(blobs: number[], x: number, y: number, r: number): void {
  "worklet";
  blobs.push(x, y - r, y + r, 2 * r);
}

/**
 * The drips at `t`: each swells out of the bottom of its letter, pinches off and
 * falls as a teardrop, the stub it leaves pulling back up. Near the water it
 * joins it; landing, it knocks a few drops up out of the pool.
 */
export function dripsAt(scene: Scene, t: number, tears: Tear[], blobs: number[]): void {
  "worklet";
  const { world, stage, beats } = scene;
  const H = stage.height;
  const y0 = world.yb;
  const surface = H - levelAt(world, t);

  for (const dp of world.drips) {
    if (t < dp.tb || t >= dp.th) continue;
    if (t < dp.td) {
      tears.push({ kind: "hang", x: dp.x, y0, r: dp.r, g: (t - dp.tb) / (dp.td - dp.tb) });
      continue;
    }
    const s = t - dp.td;
    const cy = y0 + dp.r * 3 + 0.5 * GRAVITY.drip * s * s;
    tears.push({ kind: "fall", x: dp.x, cy, r: dp.r, s });
    if (surface - (cy + dp.r) < dp.r * 2.5) pushCircle(blobs, dp.x, cy, dp.r);
    if (s < 160) tears.push({ kind: "stub", x: dp.x, y0, r: dp.r, k: s / 160 });
    if (dp.satellite && s > 25) {
      const s2 = s - 25;
      const sy = y0 + dp.r * 1.2 + 0.5 * GRAVITY.drip * s2 * s2;
      if (sy < surface) tears.push({ kind: "fall", x: dp.x, cy: sy, r: dp.r * 0.32, s: s2 });
    }
  }

  if (t < beats.splash.start) {
    for (const dp of world.drips) {
      if (t < dp.th || t > dp.th + 900) continue;
      const from = H - levelAt(world, dp.th);
      for (const k of dp.kick) {
        const s = t - dp.th - k.delay;
        if (s < 0) continue;
        const v = Math.sqrt(2 * GRAVITY.kick * k.h);
        const y = from - v * s + 0.5 * GRAVITY.kick * s * s;
        if (s > v / GRAVITY.kick && y > surface + k.r * 0.5) continue;
        pushCircle(blobs, dp.x + k.vx * s, y, k.r);
      }
    }
  }
}
