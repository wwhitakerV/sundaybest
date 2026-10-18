import { crossingTime, eruptionOf, launchSpeed, sheetTop, type Eruption } from "./eruption";
import { pushCircle } from "./frame-drips";
import { levelAt, surfaceAt } from "./pool";
import type { Scene } from "./scene";
import { EDGE_SEGMENTS, GRAVITY, type Stage } from "./settings";
import type { World } from "./world-types";

/** A flying drop and the short streak behind it, unless it's back inside the water. */
function fly(
  blobs: number[],
  e: Eruption,
  s: number,
  height: number,
  [x, y, r, vx, vy]: [number, number, number, number, number],
): void {
  "worklet";
  if (y < -50 || y > height + 20 || y - r > sheetTop(e, x, s)) return;
  pushCircle(blobs, x, y, r);
  const k = Math.min(26, 60 / Math.max(0.5, Math.hypot(vx, vy)));
  pushCircle(blobs, x - vx * k * 0.5, y - vy * k * 0.5, r * 0.8);
  pushCircle(blobs, x - vx * k, y - vy * k, r * 0.55);
}

/** The eruption's flying water at `S` ms in: the wall's shed drops, the crown's strands, the jet. */
export function eruptionDrops(
  scene: { stage: Stage; world: Pick<World, "splash"> },
  e: Eruption,
  S: number,
  blobs: number[],
): void {
  "worklet";
  const H = scene.stage.height;
  const { splash } = scene.world;
  for (const d of splash.edge) {
    const te = d.at * crossingTime(e, d.x);
    const s = S - te;
    if (s < 0) continue;
    const vy0 = -(launchSpeed(e, d.x) - e.g * te) - d.up * e.vMin;
    const y = sheetTop(e, d.x, te) + vy0 * s + 0.5 * e.g * s * s;
    fly(blobs, e, S, H, [d.x + d.vx * s, y, d.r, d.vx, vy0 + e.g * s]);
  }
  for (const st of splash.strands) {
    const s = S - st.dt;
    if (s < 0) continue;
    for (const bead of st.beads) {
      const v = st.v * bead.k * e.vMin;
      const vx = Math.sin(st.ang) * v;
      const vy0 = -Math.cos(st.ang) * v;
      fly(blobs, e, S, H, [
        st.x + vx * s,
        e.y0 - 4 + vy0 * s + 0.5 * e.g * s * s,
        bead.r,
        vx,
        vy0 + e.g * s,
      ]);
    }
  }
  for (const j of splash.jet) {
    const s = S - j.dt;
    if (s < 0) continue;
    const vy0 = -j.v * e.vMin;
    fly(blobs, e, S, H, [
      e.cx + j.dx * (1 + s / 400),
      e.y0 + vy0 * s + 0.5 * e.g * s * s,
      j.r,
      j.dx * 0.0025,
      vy0 + e.g * s,
    ]);
  }
}

/**
 * The water at `t`: the pool's edge (or the erupting wall's), the spray from the
 * letters landing, and the eruption's flying drops. Pushes into `edge` and `blobs`.
 */
export function waterAt(scene: Scene, t: number, edge: number[], blobs: number[]): void {
  "worklet";
  const { world, stage, beats } = scene;
  const { width: W, height: H } = stage;

  const base = levelAt(world, t);
  const erupting = t >= beats.splash.start;
  const e = eruptionOf(scene);
  if (base > 0.5 || erupting) {
    for (let c = 0; c <= EDGE_SEGMENTS; c++) {
      const x = (c / EDGE_SEGMENTS) * W;
      let y = surfaceAt(world, H, x, t, base);
      if (erupting) y = Math.min(y, sheetTop(e, x, t - beats.splash.start));
      edge.push(x, y);
    }
  }
  for (const sp of world.spray) {
    const s = t - sp.t0;
    if (s < 0 || s > 800) continue;
    const y = sp.y0 + sp.vy * s + 0.5 * GRAVITY.spray * s * s;
    if (s > 80 && y > H - base) continue;
    pushCircle(blobs, sp.x + sp.vx * s, y, sp.r);
  }
  if (erupting) eruptionDrops(scene, e, t - beats.splash.start, blobs);
}
