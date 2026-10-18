import { pushCircle } from "../frame-drips";
import type { Tear } from "../frame-types";
import { GRAVITY } from "../settings";
import { clearsAt } from "./drain";
import { levelAt } from "./pool";
import type { WaterScene } from "./scene";

/**
 * The drips at `t`: each swells out of the bottom of its letter, pinches off and
 * falls as a teardrop, the stub it leaves pulling back up. Near the water it
 * joins it; landing, it knocks a few drops up out of the pool.
 */
function dripsAt(scene: WaterScene, t: number, tears: Tear[], blobs: number[]): void {
  "worklet";
  const { world, beats } = scene;
  const y0 = world.yb;
  const surface = scene.stage.height - levelAt(world, t);

  for (const dp of world.drips) {
    if (t < dp.tb || t >= dp.th) continue;
    if (t < dp.td) {
      tears.push({ kind: "hang", x: dp.x, y0, r: dp.r, g: (t - dp.tb) / (dp.td - dp.tb) });
      continue;
    }
    const s = t - dp.td;
    const cy = y0 + dp.r * 3 + 0.5 * GRAVITY.drip * s * s;
    tears.push({ kind: "fall", x: dp.x, cy, r: dp.r, s });
    // Close to the water, it joins it: the pool's surface reaches up to meet the drop.
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
      const from = scene.stage.height - levelAt(world, dp.th);
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

/** The drops the drained water pops up as it leaves the bottom, each where the water leaves. */
function popsAt(scene: WaterScene, t: number, tears: Tear[]): void {
  "worklet";
  const H = scene.stage.height;
  for (const pp of scene.world.pops) {
    const s = t - clearsAt(scene, pp.x) - pp.delay;
    if (s < 0) continue;
    const v = Math.sqrt(2 * GRAVITY.pop * pp.h);
    const cy = H + pp.r - v * s + 0.5 * GRAVITY.pop * s * s;
    if (cy - pp.r > H + 4) continue;
    const rising = v / GRAVITY.pop;
    tears.push(
      s < rising
        ? { kind: "round", x: pp.x, cy, r: pp.r }
        : { kind: "fall", x: pp.x, cy, r: pp.r, s: s - rising },
    );
  }
}

/** Every drop at `t`: the drips, the drops they knock up, and the drain's pops. */
export function waterDripsAt(scene: WaterScene, t: number, tears: Tear[], blobs: number[]): void {
  "worklet";
  dripsAt(scene, t, tears, blobs);
  popsAt(scene, t, tears);
}
