import { levelAt } from "./pool";
import type { Scene } from "./scene";

/**
 * The eruption, thrown up from the pool's surface: `y0` where it starts, `g` its
 * gravity, `vMin` its slowest part's launch speed. The slowest part crosses the
 * top of the screen at three-quarters of the eruption time and would carry on to
 * 1.6× that height.
 */
export type Eruption = {
  y0: number;
  g: number;
  vMin: number;
  d: number;
  phase: number[];
  cx: number;
};

export function eruptionOf(scene: Scene): Eruption {
  "worklet";
  const { beats, stage, world } = scene;
  const y0 = stage.height - levelAt(world, beats.splash.start);
  const d = y0 + 60;
  const a = 1.6 * d;
  const crossing = beats.splash.dur * 0.75;
  const g = (2 * a) / (crossing / (1 - Math.sqrt(1 - d / a))) ** 2;
  return { y0, g, vMin: Math.sqrt(2 * g * a), d, phase: world.sheetPhase, cx: world.cx };
}

/**
 * How fast the water at `x` is thrown: a column in the middle racing ahead, a
 * broad crown around it, the edges slowest, and unevenness at every scale.
 */
export function launchSpeed(e: Eruption, x: number): number {
  "worklet";
  const [p1 = 0, p2 = 0, p3 = 0, p4 = 0] = e.phase;
  return (
    e.vMin *
    (1 +
      1.1 * Math.exp(-(((x - e.cx) / 60) ** 2)) +
      0.3 * Math.exp(-(((x - e.cx) / 150) ** 2)) +
      0.1 * (1 + Math.sin(x * 0.031 + p1)) +
      0.07 * (1 + Math.sin(x * 0.067 + p2)) +
      0.05 * (1 + Math.sin(x * 0.13 + p3)) +
      0.03 * (1 + Math.sin(x * 0.27 + p4)))
  );
}

/** How long after the eruption starts the water at `x` crosses the top of the screen. */
export function crossingTime(e: Eruption, x: number): number {
  "worklet";
  const v = launchSpeed(e, x);
  return (v - Math.sqrt(Math.max(0, v * v - 2 * e.g * e.d))) / e.g;
}

/**
 * The rising wall's top edge at `x`, `s` ms into the eruption: never still, with
 * small waves running along it; past the top, the screen there is full.
 */
export function sheetTop(e: Eruption, x: number, s: number): number {
  "worklet";
  if (s >= crossingTime(e, x)) return -60;
  const [, p2 = 0, p3 = 0] = e.phase;
  const churn = 7 * Math.sin(x * 0.09 + s * 0.021 + p2) + 4 * Math.sin(x * 0.21 - s * 0.034 + p3);
  return e.y0 - launchSpeed(e, x) * s + 0.5 * e.g * s * s + churn * Math.min(1, s / 120);
}
