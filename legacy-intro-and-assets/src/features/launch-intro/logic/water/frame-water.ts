import { sheetTop } from "../eruption";
import { pushCircle } from "../frame-drips";
import { eruptionDrops } from "../frame-water";
import { EDGE_SEGMENTS, GRAVITY } from "../settings";
import { drainOf, drainTop, releaseAt } from "./drain";
import { waterEruptionOf } from "./eruption";
import { levelAt, surfaceAt } from "./pool";
import type { WaterScene } from "./scene";

/** The pool's edge (or the erupting wall's), the spray, and the eruption's flying drops. */
function poolAt(scene: WaterScene, t: number, edge: number[], blobs: number[]): void {
  "worklet";
  const { world, stage, beats } = scene;
  const { width: W, height: H } = stage;
  const base = levelAt(world, t);
  const erupting = t >= beats.splash.start;
  const e = waterEruptionOf(scene);
  if (base > 0.5 || erupting) {
    for (let c = 0; c <= EDGE_SEGMENTS; c++) {
      const x = (c / EDGE_SEGMENTS) * W;
      let y = surfaceAt(world, x, t, base);
      if (erupting) y = Math.min(y, sheetTop(e, x, t - beats.splash.start));
      edge.push(x, y);
    }
  }
  // Spray from the pour hitting the far wall, and from the letters landing.
  for (const sp of world.spray) {
    const s = t - sp.t0;
    if (s < 0 || s > 800) continue;
    const y = sp.y0 + sp.vy * s + 0.5 * GRAVITY.spray * s * s;
    if (s > 80 && y > H - base) continue;
    pushCircle(blobs, sp.x + sp.vx * s, y, sp.r);
  }
  if (erupting) eruptionDrops(scene, e, t - beats.splash.start, blobs);
}

/**
 * The water falling away from the top: its edge falling under gravity, alive as
 * it falls, shedding drops that trail it down, each with a short streak behind it.
 */
function drainingAt(scene: WaterScene, t: number, edge: number[], blobs: number[]): void {
  "worklet";
  const { width: W, height: H } = scene.stage;
  const d = drainOf(scene);
  for (let c = 0; c <= EDGE_SEGMENTS; c++) {
    const x = (c / EDGE_SEGMENTS) * W;
    edge.push(x, drainTop(scene, x, t));
  }
  for (const e of scene.world.drain.shed) {
    const fell = e.at * d.fallFor;
    const s = t - d.start - releaseAt(scene, e.x) - fell;
    if (s < 0) continue;
    const v = d.g * fell * e.lag;
    const y = d.top0 + 0.5 * d.g * fell * fell + v * s + 0.5 * d.g * s * s;
    const x = e.x + e.vx * s;
    if (y - e.r > H || y + e.r > drainTop(scene, x, t)) continue;
    const vy = v + d.g * s;
    const k = Math.min(22, 50 / Math.max(0.5, vy));
    pushCircle(blobs, x, y, e.r);
    pushCircle(blobs, x - e.vx * k * 0.5, y - vy * k * 0.5, e.r * 0.75);
    pushCircle(blobs, x - e.vx * k, y - vy * k, e.r * 0.5);
  }
}

/** The water at `t`: the pool and its eruption, or the drain. Pushes into `edge` and `blobs`. */
export function waterAt(scene: WaterScene, t: number, edge: number[], blobs: number[]): void {
  "worklet";
  if (t < scene.beats.drain.start) poolAt(scene, t, edge, blobs);
  else drainingAt(scene, t, edge, blobs);
}
