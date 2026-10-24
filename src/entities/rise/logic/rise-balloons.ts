import { MODE, RISE, STRING_POINTS, type Balloon, type RiseGame } from "./rise-rules";
import { adrift } from "./rise-drift";
import { floorOf, laneX, segmentLength } from "./rise-setup";
import { outlineOf, pointAgainst, reachOf } from "./rise-shape";

const TAU = Math.PI * 2;
/** Rising: how far it sways and rocks, and how slowly; how far it bobs. */
const SWAY = { reach: 9, ms: 2300 };
const ROCK = { reach: 0.07, ms: 2100 };
const BOB = { reach: 2.5, ms: 1700 };
/** The knot, under the body, in points. */
const KNOT = 5;
/** A touch's springs (per ms): stiff enough to bounce back, damped enough to settle. */
const SPRING = { stiff: 0.00045, damp: 0.012 };
/**
 * Strings: gravity (points/ms²) — every string feels all of it, so it hangs
 * — how much of their swing they keep, and how often they're pulled taut.
 */
const STRING = { gravity: 0.0009, keep: 0.985, passes: 4 };
/** A string on the floor: how much of its slide along the floor it keeps each step. */
const FLOOR = { slide: 0.8 };
/**
 * A string over a balloon: how far out from the skin it lies (its
 * thickness, in points), how much of its slide along the skin it keeps, and
 * how far down its own string starts touching its own balloon (its first
 * points hang from the knot, under it).
 */
const DRAPE = { thick: 1, slide: 0.85, ownFrom: 2 };
/** Where a balloon starts, under the screen's foot: its centre this share of its height below. */
const START_BELOW = 0.6;

/** Where a balloon's string is tied: under its knot, as it's turned and squashed. */
function knotPoint(b: Balloon, game: RiseGame): { x: number; y: number } {
  "worklet";
  const down = (game.stage.balloonH / 2 + KNOT) * b.scale * (1 - b.poke);
  return { x: b.x - Math.sin(b.angle) * down, y: b.y + Math.cos(b.angle) * down };
}

/** A balloon's body as strings meet it: the balloon, its outline where it is, and how far that reaches. */
type Body = { b: Balloon; outline: number[]; reach: number };

/** A string's point `i` against every body: pushed out to the skin it's in, and sliding along it. */
function drape(b: Balloon, i: number, bodies: Body[]): void {
  "worklet";
  for (const body of bodies) {
    if (body.b === b && i < DRAPE.ownFrom) continue;
    const x = b.sx[i]!;
    const y = b.sy[i]!;
    if (Math.hypot(x - body.b.x, y - body.b.y) > body.reach + DRAPE.thick) continue;
    const { outside, nx, ny } = pointAgainst(body.outline, x, y);
    if (outside >= DRAPE.thick) continue;
    // Its move this step: what went into the skin is stopped, the slide along it kept in part.
    const vx = x - b.px[i]!;
    const vy = y - b.py[i]!;
    const into = vx * nx + vy * ny;
    const tx = vx - nx * into;
    const ty = vy - ny * into;
    const out = Math.max(0, into);
    const push = DRAPE.thick - outside;
    const sx = x + nx * push;
    const sy = y + ny * push;
    b.sx[i] = sx;
    b.sy[i] = sy;
    b.px[i] = sx - (tx * DRAPE.slide + nx * out);
    b.py[i] = sy - (ty * DRAPE.slide + ny * out);
  }
}

/**
 * A saved balloon's string and the floor (the line). Crossing in and rising
 * away, the string passes up through it freely; once all of it has cleared
 * the line, the line is its floor too — so when the balloon drifts back
 * down, a point falling onto it lands there and slides.
 */
function floorString(b: Balloon, floor: number): void {
  "worklet";
  if (!b.stringAbove) {
    for (let i = 0; i < STRING_POINTS; i += 1) if (b.sy[i]! > floor) return;
    b.stringAbove = true;
  }
  for (let i = 1; i < STRING_POINTS; i += 1) {
    if (b.sy[i]! <= floor) continue;
    b.sy[i] = floor;
    b.py[i] = floor;
    b.px[i] = b.sx[i]! - (b.sx[i]! - b.px[i]!) * FLOOR.slide;
  }
}

/**
 * One step of a string: swinging on, falling, pulled taut — tied to its knot
 * while `held`, its length its balloon's size, so it shortens as the balloon
 * drifts into the distance — draped over any balloon it meets, and, saved,
 * resting on the floor.
 */
function stepString(b: Balloon, game: RiseGame, dt: number, held: boolean, bodies: Body[]): void {
  "worklet";
  const fall = STRING.gravity * dt * dt;
  for (let i = held ? 1 : 0; i < STRING_POINTS; i += 1) {
    const x = b.sx[i]!;
    const y = b.sy[i]!;
    b.sx[i] = x + (x - b.px[i]!) * STRING.keep;
    b.sy[i] = y + (y - b.py[i]!) * STRING.keep + fall;
    b.px[i] = x;
    b.py[i] = y;
  }
  if (held) {
    const knot = knotPoint(b, game);
    b.px[0] = b.sx[0]!;
    b.py[0] = b.sy[0]!;
    b.sx[0] = knot.x;
    b.sy[0] = knot.y;
  }
  const length = segmentLength(game.stage, b.scale);
  for (let pass = 0; pass < STRING.passes; pass += 1) {
    for (let i = 1; i < STRING_POINTS; i += 1) {
      const dx = b.sx[i]! - b.sx[i - 1]!;
      const dy = b.sy[i]! - b.sy[i - 1]!;
      const apart = Math.hypot(dx, dy) || 1;
      const off = (apart - length) / apart;
      const pinned = held && i === 1;
      b.sx[i] = b.sx[i]! - dx * off * (pinned ? 1 : 0.5);
      b.sy[i] = b.sy[i]! - dy * off * (pinned ? 1 : 0.5);
      if (!pinned) {
        b.sx[i - 1] = b.sx[i - 1]! + dx * off * 0.5;
        b.sy[i - 1] = b.sy[i - 1]! + dy * off * 0.5;
      }
    }
    if (held) for (let i = 1; i < STRING_POINTS; i += 1) drape(b, i, bodies);
  }
  if (held && b.mode === MODE.free) floorString(b, floorOf(game.stage));
}

/** A touch's squash and push, springing back. */
function springs(b: Balloon, dt: number): void {
  "worklet";
  b.pokeV += (-b.poke * SPRING.stiff - b.pokeV * SPRING.damp) * dt;
  b.poke += b.pokeV * dt;
  b.nudgeV += (-b.nudge * SPRING.stiff - b.nudgeV * SPRING.damp) * dt;
  b.nudge += b.nudgeV * dt;
}

/** A balloon on its rise: timed to touch the line at `RISE.riseMs`, swaying, rocking and bobbing. */
function rising(b: Balloon, game: RiseGame, dt: number): void {
  "worklet";
  const { stage, time } = game;
  const pair = game.pairs[b.pair]!;
  const startY = stage.height + stage.balloonH * START_BELOW;
  const crossY = stage.lineY + stage.balloonH / 2;
  const share = (time - pair.start) / RISE.riseMs;
  const x =
    laneX(stage, b.pair, b.side) +
    Math.sin((time / SWAY.ms + b.phase) * TAU) * SWAY.reach +
    b.nudge;
  const y =
    startY + (crossY - startY) * share + Math.sin((time / BOB.ms + b.phase * 3) * TAU) * BOB.reach;
  b.vx = (x - b.x) / dt;
  b.vy = (y - b.y) / dt;
  b.x = x;
  b.y = y;
  b.angle =
    Math.sin((time / ROCK.ms + b.phase * 2) * TAU) * ROCK.reach + b.nudge * 0.006 + b.vx * 0.05;
}

/**
 * One step of every balloon: a pair's set off when its time comes; rising
 * ones on their way, on the clock; the survivor and the saved adrift in the
 * atmosphere (`adrift`); then every string swung on, draped over the
 * balloons it meets and resting on the floor — a burst one's falling away
 * until it's gone.
 */
export function stepBalloons(game: RiseGame, dt: number): void {
  "worklet";
  for (const b of game.balloons) {
    if (b.mode === MODE.waiting && game.time >= game.pairs[b.pair]!.start) b.mode = MODE.rising;
    if (b.mode === MODE.rising) rising(b, game, dt);
  }
  adrift(game, dt);
  // Every balloon in the air, as its strings meet it: where it is once it's moved.
  const bodies: Body[] = [];
  for (const b of game.balloons) {
    if (b.mode === MODE.rising || b.mode === MODE.crossing || b.mode === MODE.free) {
      bodies.push({ b, outline: outlineOf(b, game.stage), reach: reachOf(b, game.stage) });
    }
  }
  for (const b of game.balloons) {
    if (b.mode === MODE.rising || b.mode === MODE.crossing || b.mode === MODE.free) {
      springs(b, dt);
      stepString(b, game, dt, true, bodies);
    } else if (b.mode === MODE.popped) {
      stepString(b, game, dt, false, bodies);
      if (Math.min(...b.sy) > game.stage.height + 20) b.mode = MODE.gone;
    }
  }
}
