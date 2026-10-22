import { MODE, RISE, STRING_POINTS, type Balloon, type RiseGame } from "./rise-rules";
import { adrift } from "./rise-drift";
import { laneX, segmentLength } from "./rise-setup";

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
 * Strings: gravity (points/ms²) — a saved balloon's string, adrift, feels
 * only this share of it, so it floats and trails — how much of their swing
 * they keep, and how often they're pulled taut.
 */
const STRING = { gravity: 0.0009, adrift: 0.1, keep: 0.985, passes: 4 };
/** Where a balloon starts, under the screen's foot: its centre this share of its height below. */
const START_BELOW = 0.6;

/** Where a balloon's string is tied: under its knot, as it's turned and squashed. */
function knotPoint(b: Balloon, game: RiseGame): { x: number; y: number } {
  "worklet";
  const down = (game.stage.balloonH / 2 + KNOT) * b.scale * (1 - b.poke);
  return { x: b.x - Math.sin(b.angle) * down, y: b.y + Math.cos(b.angle) * down };
}

/** One step of a string: swinging on, falling, pulled taut — tied to its knot while `held`. */
function stepString(b: Balloon, game: RiseGame, dt: number, held: boolean): void {
  "worklet";
  const fall = STRING.gravity * (b.mode === MODE.free ? STRING.adrift : 1) * dt * dt;
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
  }
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
 * atmosphere (`adrift`); then every string swung on — a burst one's falling
 * away until it's gone.
 */
export function stepBalloons(game: RiseGame, dt: number): void {
  "worklet";
  for (const b of game.balloons) {
    if (b.mode === MODE.waiting && game.time >= game.pairs[b.pair]!.start) b.mode = MODE.rising;
    if (b.mode === MODE.rising) rising(b, game, dt);
  }
  adrift(game, dt);
  for (const b of game.balloons) {
    if (b.mode === MODE.rising || b.mode === MODE.crossing || b.mode === MODE.free) {
      springs(b, dt);
      stepString(b, game, dt, true);
    } else if (b.mode === MODE.popped) {
      stepString(b, game, dt, false);
      if (Math.min(...b.sy) > game.stage.height + 20) b.mode = MODE.gone;
    }
  }
}
