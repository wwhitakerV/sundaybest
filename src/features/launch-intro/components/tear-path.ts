import { Skia, type SkPath } from "@shopify/react-native-skia";

import { clamp01, easeOut, mix } from "../logic/ease";
import type { Tear } from "../logic/frame-types";
import { GRAVITY } from "../logic/settings";

/**
 * A drop hanging from a letter, `g` from 0 (just appearing) to 1 (about to let
 * go). Ink pours in steadily, so it grows by volume: quickly at first, then
 * slowly; it hangs almost still while it fills, then stretches and pinches off.
 */
function hanging(path: SkPath, x: number, y0: number, r: number, g: number): void {
  "worklet";
  const rb = r * Math.cbrt(clamp01(g * 1.1));
  const cy = y0 + rb * 0.6 + r * 0.35 * g + r * 2.05 * g ** 5;
  const a = r * (0.7 + 0.5 * g);
  const n = mix(r, r * 0.55, g) * (1 - clamp01((g - 0.88) / 0.12) * 0.88);
  const yn = y0 + Math.max(0, cy - rb - y0) * 0.6;
  path.moveTo(x - a, y0 - 2);
  path.cubicTo(x - a * 0.55, y0, x - n, yn - (yn - y0) * 0.5, x - n, yn);
  path.cubicTo(x - n, yn + (cy - yn) * 0.5, x - rb, cy - rb * 0.6, x - rb, cy);
  path.arcToOval(Skia.XYWHRect(x - rb, cy - rb, rb * 2, rb * 2), 180, -180, false);
  path.cubicTo(x + rb, cy - rb * 0.6, x + n, yn + (cy - yn) * 0.5, x + n, yn);
  path.cubicTo(x + n, yn - (yn - y0) * 0.5, x + a * 0.55, y0, x + a, y0 - 2);
  path.close();
}

/**
 * A falling teardrop: round below, drawn to a point above. Just after it lets
 * go its tail snaps shorter; then the faster it falls, the longer the tail.
 */
function falling(path: SkPath, x: number, cy: number, r: number, s: number): void {
  "worklet";
  const tail = r * (1.5 - 0.7 * clamp01(s / 120)) + Math.min(r * 1.4, GRAVITY.drip * s * r * 0.9);
  const tip = cy - r - tail;
  path.moveTo(x, tip);
  path.cubicTo(x + r * 0.35, tip + tail * 0.45, x + r, cy - r * 0.55, x + r, cy);
  path.arcToOval(Skia.XYWHRect(x - r, cy - r, r * 2, r * 2), 0, 180, false);
  path.cubicTo(x - r, cy - r * 0.55, x - r * 0.35, tip + tail * 0.45, x, tip);
  path.close();
}

/** What's left on a letter after a drop lets go, `k` 0–1, pulling back up into it. */
function stub(path: SkPath, x: number, y0: number, r: number, k: number): void {
  "worklet";
  const h = r * 0.8 * (1 - easeOut(k));
  const a = r * 1.15 * (1 - 0.4 * k);
  path.moveTo(x - a, y0 - 2);
  path.quadTo(x, y0 + h * 2, x + a, y0 - 2);
  path.close();
}

/** A crisp drop's outline. */
export function tearPath(tear: Tear): SkPath {
  "worklet";
  const path = Skia.Path.Make();
  if (tear.kind === "hang") hanging(path, tear.x, tear.y0, tear.r, tear.g);
  else if (tear.kind === "fall") falling(path, tear.x, tear.cy, tear.r, tear.s);
  else if (tear.kind === "stub") stub(path, tear.x, tear.y0, tear.r, tear.k);
  else path.addCircle(tear.x, tear.cy, tear.r);
  return path;
}
