import { MODE, type Balloon, type RiseGame } from "./rise-rules";
import { resolveContact, type Contact } from "./rise-contact";
import { edgeOf, floorOf } from "./rise-setup";
import { outlineContact, outlineOf, pointAgainst, reachOf } from "./rise-shape";

/**
 * The atmosphere, as space: from the moment a pair locks, its survivor is a
 * body like the saved — rising on, the line a one-way floor under it until
 * it's wholly inside, and saved. The saved cruise at their own steady pace,
 * nearer ones larger and a touch quicker. Every balloon touches the others
 * outline to outline, as drawn, and bounces off them by its size, a glancing knock turning
 * it; none ever passes through another. Each frame is stepped in
 * `SUBSTEPS`, so nothing tunnels or jitters. Worklets, each after what it calls.
 */

const TAU = Math.PI * 2;
/** Steps a frame: small enough that a quick bump never passes through. */
const SUBSTEPS = 4;
/** How near or far a saved balloon floats: its size against the saved size, far to near. */
const DEPTH = { far: 0.78, near: 1.12 };
/** How quickly it settles to its size at its depth: quickly, so it's drifting small before it nears the top. */
const SHRINK = 0.006;
/** It starts shrinking into the distance once this much of it (points) has crossed above the line. */
const SHRINK_FROM = 10;
/** Its cruise (points/ms) — slow; the nearer, a touch quicker — and how quickly it returns to it. */
const CRUISE = { far: 0.016, near: 0.03, settle: 0.0012 };
/**
 * Just saved, it rises straight on, easing (this quickly, per ms) from its
 * crossing to its drifting pace, until the top slows it to rest within
 * `nearTop` (points) of it.
 */
const AWAY = { settle: 0.003, nearTop: 8 };
/** Then it wanders off its own way, turning to it this quickly (per ms) until within `near` of it (points/ms). */
const TURN = { settle: 0.005, near: 0.002 };
/** The ways it may wander off from under the top, in half-turns from rightward: all of them down a little. */
const WANDER = { from: 0.1, to: 0.9 };
/** Just saved and rising away, it never meets the top hard: its rise is held to this much (per ms) of the room left. */
const CEILING = { ease: 0.004 };
/** Crossing in: the steady pace it rises at (points/ms), and how quickly it returns to it. */
const CROSSING = { rise: 0.08, settle: 0.002 };
/** How much speed a bounce keeps: off an edge, and off another balloon. */
const KEEP = { wall: 0.94, balloon: 0.85 };
/** A hard hit off an edge keeps less: up to this much less, from an impact this fast (points/ms). */
const HARD_HIT = { loses: 0.14, at: 0.8 };
/**
 * Thrown, it coasts through air: drag that grows with its speed (per ms, and
 * per ms per point/ms) — a rush shed quickly, a long glide after — until it's
 * slowed to `handBack` times its drift's pace, when its drift takes it back.
 */
const COAST = { drag: 1 / 3000, rush: 0.00035, handBack: 1.3 };
/**
 * Its lean into its drift, and the spring rocking it back (per ms²), damped
 * as something light in air is — a knock tips it, never turns it over —
 * and the fastest it ever turns (radians/ms).
 */
const TILT = { lean: 3.2, most: 0.45, stiff: 0.000012, damp: 0.0025, fastest: 0.003 };

/** Whether a point is on a balloon's body: inside its outline, as drawn. */
export function touchesBalloon(b: Balloon, game: RiseGame, x: number, y: number): boolean {
  "worklet";
  return pointAgainst(outlineOf(b, game.stage), x, y).outside <= 0;
}

/** One substep of its own motion: cruising (or, crossing, lifted on), leaning and rocking. */
function move(b: Balloon, game: RiseGame, dt: number): void {
  "worklet";
  // Held, a finger moves it; stopped by a touch, it stays still a beat — it only leans and rights itself.
  const resting = b.restUntil !== undefined && game.time < b.restUntil;
  if (b.held || resting) {
    if (resting) {
      b.vx = 0;
      b.vy = 0;
    }
    const lean = Math.max(-TILT.most, Math.min(TILT.most, b.vx * TILT.lean));
    b.spin += (-(b.angle - lean) * TILT.stiff - b.spin * TILT.damp) * dt;
    b.angle += b.spin * dt;
    return;
  }
  // Once 10pt of it is over the line, it starts shrinking into the distance — and keeps on.
  const top = b.y - (game.stage.balloonH / 2) * b.scale;
  if (!b.shrinking && top <= game.stage.lineY - SHRINK_FROM) b.shrinking = true;
  if (b.shrinking) {
    const target = game.stage.savedScale * (DEPTH.far + (DEPTH.near - DEPTH.far) * b.depth);
    b.scale += (target - b.scale) * Math.min(1, SHRINK * dt);
  }
  if (b.mode === MODE.free) {
    const cruise = CRUISE.far + (CRUISE.near - CRUISE.far) * b.depth;
    const speed = Math.hypot(b.vx, b.vy);
    if (b.thrown && speed > cruise * COAST.handBack) {
      const keep = Math.max(0, 1 - (COAST.drag + COAST.rush * speed) * dt);
      b.vx *= keep;
      b.vy *= keep;
    } else if (b.thrown) {
      b.thrown = false;
    } else if (!b.drifting) {
      // Just saved: rising straight on, slowing to its drift's pace, until it rests under the top.
      const ease = Math.min(1, AWAY.settle * dt);
      b.vx += -b.vx * ease;
      b.vy += (-cruise - b.vy) * ease;
      if (top - edgeOf(game.stage) < AWAY.nearTop) {
        // At rest under the top: it wanders off its own way, always away from the top — down and to a side.
        b.drifting = true;
        b.heading = (WANDER.from + b.phase * (WANDER.to - WANDER.from)) * Math.PI;
      }
    } else if (b.heading !== undefined) {
      // Turning from its rise onto its own way, then drifting as the rest do.
      const ease = Math.min(1, TURN.settle * dt);
      const tx = Math.cos(b.heading) * cruise;
      const ty = Math.sin(b.heading) * cruise;
      b.vx += (tx - b.vx) * ease;
      b.vy += (ty - b.vy) * ease;
      if (Math.hypot(tx - b.vx, ty - b.vy) < TURN.near) delete b.heading;
    } else if (speed < 0.0001) {
      b.vx = Math.cos(b.phase * TAU) * cruise;
      b.vy = Math.sin(b.phase * TAU) * cruise;
    } else {
      const toward = 1 + (cruise / speed - 1) * Math.min(1, CRUISE.settle * dt);
      b.vx *= toward;
      b.vy *= toward;
    }
    // Rising away, it comes to rest under the top; drifting, the top's an edge like the others.
    const most = Math.max(0, top - edgeOf(game.stage)) * CEILING.ease;
    if (!b.drifting && !b.thrown && b.vy < -most) b.vy = -most;
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

/** Off the atmosphere's edges, outline against edge — the line a floor for the saved, never for one crossing in. */
function walls(b: Balloon, game: RiseGame): void {
  "worklet";
  const { stage } = game;
  const outline = outlineOf(b, stage);
  // Each edge's deepest point of the outline past it — the left, right, top and floor: [depth, x, y].
  const deepest = [
    [-Infinity, 0, 0],
    [-Infinity, 0, 0],
    [-Infinity, 0, 0],
    [-Infinity, 0, 0],
  ];
  for (let i = 0; i < outline.length; i += 2) {
    const x = outline[i]!;
    const y = outline[i + 1]!;
    const clear = edgeOf(stage);
    const past = [clear - x, x - (stage.width - clear), clear - y, y - floorOf(stage)];
    for (let k = 0; k < 4; k += 1) {
      if (past[k]! > deepest[k]![0]!) deepest[k] = [past[k]!, x, y];
    }
  }
  const normals = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  const edges = b.mode === MODE.free ? 4 : 3;
  for (let k = 0; k < edges; k += 1) {
    const [depth = 0, px = 0, py = 0] = deepest[k]!;
    if (depth <= 0) continue;
    const [nx = 0, ny = 0] = normals[k]!;
    const edge: Contact = { depth, px, py, nx, ny };
    const impact = Math.abs(b.vx * nx + b.vy * ny);
    const keep = KEEP.wall - HARD_HIT.loses * Math.min(1, impact / HARD_HIT.at);
    resolveContact(game, null, b, edge, keep);
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

/** Two balloons touching, outline to outline, from `a` toward `b` — or none. */
function touch(a: Balloon, b: Balloon, game: RiseGame): Contact | null {
  "worklet";
  const apart = Math.hypot(b.x - a.x, b.y - a.y);
  if (apart > reachOf(a, game.stage) + reachOf(b, game.stage)) return null;
  return outlineContact(outlineOf(a, game.stage), outlineOf(b, game.stage));
}

/**
 * A string's own swing settled to its balloon's, as it's saved: carried up
 * on the rise, slowing to a drift it would fly on up into the balloon — it
 * moves with the knot instead, and hangs.
 */
function calmString(b: Balloon): void {
  "worklet";
  const dx = b.sx[0]! - b.px[0]!;
  const dy = b.sy[0]! - b.py[0]!;
  for (let i = 0; i < b.sx.length; i += 1) {
    b.px[i] = b.sx[i]! - dx;
    b.py[i] = b.sy[i]! - dy;
  }
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
        const contact = touch(a, b, game);
        if (contact) resolveContact(game, a, b, contact, KEEP.balloon);
      }
    }
    for (const b of floating) walls(b, game);
  }
  for (const b of floating) {
    const halfH = (game.stage.balloonH / 2) * b.scale;
    if (b.mode === MODE.crossing && b.y + halfH < game.stage.lineY - 2) {
      b.mode = MODE.free;
      calmString(b);
      game.events.saves += 1;
    }
  }
}
