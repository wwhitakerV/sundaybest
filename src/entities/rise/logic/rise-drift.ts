import { MODE, type Balloon, type RiseGame } from "./rise-rules";
import { resolveContact, type Contact } from "./rise-contact";

/**
 * The atmosphere, as space: from the moment a pair locks, its survivor is a
 * body like the saved — rising on, the line a one-way floor under it until
 * it's wholly inside, and saved. The saved cruise at their own steady pace,
 * nearer ones larger and a touch quicker. Every balloon touches the others
 * edge to edge and bounces off them by its size, a glancing knock turning
 * it; none ever passes through another. Each frame is stepped in
 * `SUBSTEPS`, so nothing tunnels or jitters. Worklets, each after what it calls.
 */

const TAU = Math.PI * 2;
/** Steps a frame: small enough that a quick bump never passes through. */
const SUBSTEPS = 4;
/**
 * A balloon's body as three circles down its middle — fitted to its drawn
 * outline to within 4% of its half-width — in half-widths from its centre.
 */
const SHAPE = [
  { y: -0.127, r: 1.03 },
  { y: 0.425, r: 0.7 },
  { y: 0.875, r: 0.3 },
];
/** How near or far a saved balloon floats: its size against the saved size, far to near. */
const DEPTH = { far: 0.78, near: 1.12 };
/** How quickly it settles to its size at its depth. */
const SHRINK = 0.0025;
/** Its cruise (points/ms) — slow; the nearer, a touch quicker — and how quickly it returns to it. */
const CRUISE = { far: 0.016, near: 0.03, settle: 0.0012 };
/** Crossing in: the steady pace it rises at (points/ms), and how quickly it returns to it. */
const CROSSING = { rise: 0.08, settle: 0.002 };
/** How much speed a bounce keeps: off an edge, and off another balloon. */
const KEEP = { wall: 0.94, balloon: 0.85 };
/** How close to the atmosphere's edges it may come. */
const CLEAR = 6;
/**
 * Its lean into its drift, and the spring rocking it back (per ms²), damped
 * as something light in air is — a knock tips it, never turns it over —
 * and the fastest it ever turns (radians/ms).
 */
const TILT = { lean: 3.2, most: 0.45, stiff: 0.000012, damp: 0.0025, fastest: 0.003 };

/** Where its three circles are now, turned with it: [x, y, radius] each. */
function circlesOf(b: Balloon, game: RiseGame): number[] {
  "worklet";
  const half = (game.stage.balloonW / 2) * b.scale;
  const sin = Math.sin(b.angle);
  const cos = Math.cos(b.angle);
  const out: number[] = [];
  for (const part of SHAPE) {
    out.push(b.x - sin * part.y * half, b.y + cos * part.y * half, part.r * half);
  }
  return out;
}

/** One substep of its own motion: cruising (or, crossing, lifted on), leaning and rocking. */
function move(b: Balloon, game: RiseGame, dt: number): void {
  "worklet";
  if (b.mode === MODE.free) {
    const target = game.stage.savedScale * (DEPTH.far + (DEPTH.near - DEPTH.far) * b.depth);
    b.scale += (target - b.scale) * Math.min(1, SHRINK * dt);
    const cruise = CRUISE.far + (CRUISE.near - CRUISE.far) * b.depth;
    const speed = Math.hypot(b.vx, b.vy);
    if (speed < 0.0001) {
      b.vx = Math.cos(b.phase * TAU) * cruise;
      b.vy = Math.sin(b.phase * TAU) * cruise;
    } else {
      const toward = 1 + (cruise / speed - 1) * Math.min(1, CRUISE.settle * dt);
      b.vx *= toward;
      b.vy *= toward;
    }
  } else {
    b.vy += (-CROSSING.rise - b.vy) * Math.min(1, CROSSING.settle * dt);
  }
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  b.angle += b.spin * dt;
  const lean = Math.max(-TILT.most, Math.min(TILT.most, b.vx * TILT.lean));
  b.spin += (-(b.angle - lean) * TILT.stiff - b.spin * TILT.damp) * dt;
  b.spin = Math.max(-TILT.fastest, Math.min(TILT.fastest, b.spin));
}

/** Off the atmosphere's edges — the line a floor for the saved, never for one crossing in. */
function walls(b: Balloon, game: RiseGame): void {
  "worklet";
  const { stage } = game;
  const circles = circlesOf(b, game);
  for (let i = 0; i < circles.length; i += 3) {
    const [x, y, r] = [circles[i]!, circles[i + 1]!, circles[i + 2]!];
    const edges: Contact[] = [
      { depth: CLEAR + r - x, px: x - r, py: y, nx: 1, ny: 0 },
      { depth: x + r - (stage.width - CLEAR), px: x + r, py: y, nx: -1, ny: 0 },
      { depth: CLEAR + r - y, px: x, py: y - r, nx: 0, ny: 1 },
    ];
    if (b.mode === MODE.free) {
      edges.push({ depth: y + r - (stage.lineY - CLEAR), px: x, py: y + r, nx: 0, ny: -1 });
    }
    for (const edge of edges) {
      if (edge.depth > 0) resolveContact(game, null, b, edge, KEEP.wall);
    }
  }
  if (b.mode === MODE.crossing) {
    // One way: pushed back, it never sinks below where it touched the line.
    const lowest = stage.lineY + (stage.balloonH / 2) * b.scale;
    if (b.y > lowest) {
      b.y = lowest;
      b.vy = Math.min(0, b.vy);
    }
  }
}

/** The deepest touch between two balloons' circles, from `a` toward `b` — or none. */
function touch(a: number[], b: number[]): Contact | null {
  "worklet";
  let deepest: Contact | null = null;
  for (let i = 0; i < a.length; i += 3) {
    for (let j = 0; j < b.length; j += 3) {
      const dx = b[j]! - a[i]!;
      const dy = b[j + 1]! - a[i + 1]!;
      const apart = Math.hypot(dx, dy) || 0.0001;
      const depth = a[i + 2]! + b[j + 2]! - apart;
      if (depth <= 0 || (deepest && depth <= deepest.depth)) continue;
      const nx = dx / apart;
      const ny = dy / apart;
      deepest = { depth, px: a[i]! + nx * a[i + 2]!, py: a[i + 1]! + ny * a[i + 2]!, nx, ny };
    }
  }
  return deepest;
}

/** Whether a balloon is adrift: saved, or crossing in. */
function isAdrift(b: Balloon): boolean {
  "worklet";
  return b.mode === MODE.free || b.mode === MODE.crossing;
}

/**
 * One frame of the atmosphere, in substeps: every balloon adrift moved, each
 * pair touching pushed apart and bounced, the edges kept — and one crossing
 * in, once wholly inside, saved (counted).
 */
export function adrift(game: RiseGame, dt: number): void {
  "worklet";
  const floating = game.balloons.filter(isAdrift);
  if (floating.length === 0) return;
  const step = dt / SUBSTEPS;
  for (let sub = 0; sub < SUBSTEPS; sub += 1) {
    for (const b of floating) move(b, game, step);
    for (let i = 0; i < floating.length; i += 1) {
      for (let j = i + 1; j < floating.length; j += 1) {
        const a = floating[i]!;
        const b = floating[j]!;
        const contact = touch(circlesOf(a, game), circlesOf(b, game));
        if (contact) resolveContact(game, a, b, contact, KEEP.balloon);
      }
    }
    for (const b of floating) walls(b, game);
  }
  for (const b of floating) {
    const halfH = (game.stage.balloonH / 2) * b.scale;
    if (b.mode === MODE.crossing && b.y + halfH < game.stage.lineY - 2) {
      b.mode = MODE.free;
      game.events.saves += 1;
    }
  }
}
