import type { Beat } from "../scene";
import type { Stage } from "../settings";
import { EDGE_SEGMENTS } from "../settings";
import type { WaterWorld } from "./world-types";

/** What the drain needs: the screen, when it drains, and its seeded unevenness. */
export type DrainScene = {
  stage: Stage;
  beats: { drain: Beat };
  world: Pick<WaterWorld, "drain" | "sx">;
};

/** Where the water's top starts as it lets go: just above the screen. */
const TOP = -60;

/** How much the falling top edge churns up and down, at most, in points (`drainTop`'s 5 + 3). */
const CHURN = 8;

/**
 * The water falling away as one sheet: each part of the width lets go a moment
 * apart from its neighbours (`release`), then falls freely under gravity `g`,
 * so it's off the bottom by `fallFor` after it lets go.
 */
export function drainOf(scene: DrainScene) {
  "worklet";
  const T = scene.beats.drain.dur;
  const fallFor = T * 0.8;
  const g = (2 * (scene.stage.height + 60 - TOP)) / (fallFor * fallFor);
  return { T, fallFor, g, top0: TOP, start: scene.beats.drain.start };
}

/** When the water at `x` lets go, in ms after the drain starts. */
export function releaseAt(scene: DrainScene, x: number): number {
  "worklet";
  const [p1 = 0, p2 = 0, p3 = 0] = scene.world.drain.phase;
  const u = x / scene.world.sx;
  return (
    scene.beats.drain.dur *
    (0.1 +
      0.035 * Math.sin(u * 0.023 + p1) +
      0.018 * Math.sin(u * 0.061 + p2) +
      0.008 * Math.sin(u * 0.15 + p3))
  );
}

/** The draining water's top edge at `x`, at `t`: falling, and alive as it falls. */
export function drainTop(scene: DrainScene, x: number, t: number): number {
  "worklet";
  const d = drainOf(scene);
  const [, p2 = 0, p3 = 0] = scene.world.drain.phase;
  const u = x / scene.world.sx;
  const s = Math.max(0, t - d.start - releaseAt(scene, x));
  const churn = 5 * Math.sin(u * 0.08 + t * 0.02 + p2) + 3 * Math.sin(u * 0.19 - t * 0.03 + p3);
  return d.top0 + 0.5 * d.g * s * s + churn * Math.min(1, s / 100);
}

/** When the water at `x` has fallen off the bottom of the screen. */
export function clearsAt(scene: DrainScene, x: number): number {
  "worklet";
  const d = drainOf(scene);
  return d.start + releaseAt(scene, x) + Math.sqrt((2 * (scene.stage.height - d.top0)) / d.g);
}

/** The last part of the width to let go, in ms after the drain starts. */
function lastRelease(scene: DrainScene): number {
  "worklet";
  let last = 0;
  for (let c = 0; c <= EDGE_SEGMENTS; c++) {
    last = Math.max(last, releaseAt(scene, (c / EDGE_SEGMENTS) * scene.stage.width));
  }
  return last;
}

/**
 * How far down the screen the water has uncovered the page at `t`, in points:
 * everything above this line is clear of it. Nothing before it drains; it only
 * ever moves down, and is past the bottom once the water has gone.
 */
export function uncoveredTo(scene: DrainScene, t: number): number {
  "worklet";
  const d = drainOf(scene);
  const s = Math.max(0, t - d.start - lastRelease(scene));
  return d.top0 + 0.5 * d.g * s * s - CHURN;
}
