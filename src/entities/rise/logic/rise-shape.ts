import type { Balloon, Stage } from "./rise-rules";

/**
 * A balloon's body, the one shape both the drawing and the physics use, so
 * what touches is what's seen: its outline as four curves, in shares of its
 * half-width (x) and half-height (y) from its middle; how a touch squashes it
 * and how lopsided it is; and the outline, sampled to a convex polygon, set
 * where a balloon is — turned, scaled and squashed as it's drawn. Worklets,
 * each after what it calls.
 */

/** Where the outline starts (its top), then each curve: two control points and where it ends. */
export const BODY = {
  start: [0, -1],
  curves: [
    [0.56, -1, 1, -0.52, 1, -0.05],
    [1, 0.45, 0.42, 0.86, 0, 1],
    [-0.42, 0.86, -1, 0.45, -1, -0.05],
    [-1, -0.52, -0.56, -1, 0, -1],
  ],
} as const;

/** How far a squash spreads it, and how lopsided a balloon may be. */
const SQUASH_SPREAD = 0.6;
const LOPSIDED = 0.05;

/** Points sampled along each curve: the outline's polygon is four times this. */
const SAMPLES = 8;

/** A cubic's point `t` of the way along it, from (x0, y0). */
function cubicAt(x0: number, y0: number, c: readonly number[], t: number): [number, number] {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return [a * x0 + b * c[0]! + d * c[2]! + e * c[4]!, a * y0 + b * c[1]! + d * c[3]! + e * c[5]!];
}

/** The outline as a polygon in shares, clockwise on the screen: [x, y, …], each curve's end the next's start. */
function sampleOutline(): number[] {
  const out: number[] = [];
  let x0: number = BODY.start[0];
  let y0: number = BODY.start[1];
  for (const curve of BODY.curves) {
    for (let i = 0; i < SAMPLES; i += 1) out.push(...cubicAt(x0, y0, curve, i / SAMPLES));
    x0 = curve[4];
    y0 = curve[5];
  }
  return out;
}

/** The outline's polygon, in shares of the half-width and half-height. */
const OUTLINE: readonly number[] = sampleOutline();

/** A balloon's horizontal and vertical stretch as it's drawn: its size, squashed, lopsided. */
export function bodyStretch(b: Balloon): { x: number; y: number } {
  "worklet";
  return {
    x: b.scale * (1 + b.poke * SQUASH_SPREAD) * (1 + (b.phase - 0.5) * LOPSIDED),
    y: b.scale * (1 - b.poke),
  };
}

/** A balloon's outline where it is, on the screen: [x, y, …], clockwise. */
export function outlineOf(b: Balloon, stage: Stage): number[] {
  "worklet";
  const stretch = bodyStretch(b);
  const rx = (stage.balloonW / 2) * stretch.x;
  const ry = (stage.balloonH / 2) * stretch.y;
  const cos = Math.cos(b.angle);
  const sin = Math.sin(b.angle);
  const out: number[] = [];
  for (let i = 0; i < OUTLINE.length; i += 2) {
    const lx = OUTLINE[i]! * rx;
    const ly = OUTLINE[i + 1]! * ry;
    out.push(b.x + lx * cos - ly * sin, b.y + lx * sin + ly * cos);
  }
  return out;
}

/** The farthest any of its outline is from its middle: for a quick "can't be touching". */
export function reachOf(b: Balloon, stage: Stage): number {
  "worklet";
  const stretch = bodyStretch(b);
  return Math.max((stage.balloonW / 2) * stretch.x, (stage.balloonH / 2) * stretch.y);
}

/** Edge `i` of a polygon's outward normal, unit length: the polygon runs clockwise on the screen. */
function normalOf(poly: readonly number[], i: number): [number, number] {
  "worklet";
  const n = poly.length;
  const dx = poly[(i + 2) % n]! - poly[i]!;
  const dy = poly[(i + 3) % n]! - poly[i + 1]!;
  const length = Math.hypot(dx, dy) || 1;
  return [dy / length, -dx / length];
}

/**
 * Where a point is against a polygon: how far outside its nearest edge
 * (negative, inside) and that edge's outward normal.
 */
export function pointAgainst(poly: readonly number[], x: number, y: number) {
  "worklet";
  let outside = -Infinity;
  let nx = 0;
  let ny = -1;
  for (let i = 0; i < poly.length; i += 2) {
    const [ex, ey] = normalOf(poly, i);
    const distance = (x - poly[i]!) * ex + (y - poly[i + 1]!) * ey;
    if (distance > outside) {
      outside = distance;
      nx = ex;
      ny = ey;
    }
  }
  return { outside, nx, ny };
}

/** The least `a`'s edges keep `b` out by: negative, how deep `b` reaches in — and where, and which way. */
function separation(a: readonly number[], b: readonly number[]) {
  "worklet";
  let best = -Infinity;
  let at = { nx: 0, ny: 0, px: 0, py: 0 };
  for (let i = 0; i < a.length; i += 2) {
    const [nx, ny] = normalOf(a, i);
    let least = Infinity;
    let px = 0;
    let py = 0;
    for (let j = 0; j < b.length; j += 2) {
      const d = (b[j]! - a[i]!) * nx + (b[j + 1]! - a[i + 1]!) * ny;
      if (d < least) {
        least = d;
        px = b[j]!;
        py = b[j + 1]!;
      }
    }
    if (least > best) {
      best = least;
      at = { nx, ny, px, py };
    }
    if (best > 0) break;
  }
  return { gap: best, ...at };
}

/**
 * Two convex outlines touching: how deep, where (halfway into the overlap),
 * and the way from `a` to `b` — or none, when there's any gap between them.
 */
export function outlineContact(a: readonly number[], b: readonly number[]) {
  "worklet";
  const fromA = separation(a, b);
  if (fromA.gap >= 0) return null;
  const fromB = separation(b, a);
  if (fromB.gap >= 0) return null;
  if (fromA.gap >= fromB.gap) {
    const depth = -fromA.gap;
    return {
      depth,
      nx: fromA.nx,
      ny: fromA.ny,
      px: fromA.px + (fromA.nx * depth) / 2,
      py: fromA.py + (fromA.ny * depth) / 2,
    };
  }
  const depth = -fromB.gap;
  return {
    depth,
    nx: -fromB.nx,
    ny: -fromB.ny,
    px: fromB.px + (fromB.nx * depth) / 2,
    py: fromB.py + (fromB.ny * depth) / 2,
  };
}
