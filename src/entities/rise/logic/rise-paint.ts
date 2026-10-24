import { MODE, RISE, type Balloon, type RiseGame } from "./rise-rules";
import { hash01 } from "./rise-setup";

/**
 * Crossing out: a stroke painted across a balloon of the pair now rising, in
 * thick white. It's stored in the balloon's own points, so it turns and drifts
 * with it. Once it's run `RISE.markLength` across, it marks the balloon — and
 * the other's mark, if it had one, goes. A tap or dab never marks, and is
 * taken back. Flecks fly off a quick stroke; those past the balloon's edge
 * land on the glass, white, seen only over black paint. Worklets, each after
 * what it calls.
 */

/** The brush, in points: widest slow, narrowest fast, a little thicker where it starts. */
const BRUSH = { widest: 15, narrowest: 7, perPoint: 0.45, start: 1.15 };
/** The balloon width the brush is set for: on a smaller balloon (Home's preview), it's narrower to match. */
const BRUSH_FOR_WIDTH = 140;
/** A point nearer the last than this isn't added. */
const STEP = 3;
/** Flecks: from this fast, how often, how far ahead and aside they fly, how big. */
const FLECK = { from: 6, odds: 30, ahead: 16, aside: 1.6, least: 0.7, more: 2.3 };
/** Lifted, the brush flicks off: this many flecks, this far past the end. */
const FLICK = { count: 3, least: 8, more: 20 };
/** How much a stroke squashes and pushes its balloon. */
const PRESS = { begin: 0.00028, per: 0.000006, push: 0.0005 };
/** Most points of paint a balloon carries. */
const MOST_POINTS = 400;
/** A touch this far inside a balloon's outline is on it. */
const HIT = 0.95;

/** The brush's size against the balloons': the same mark on a balloon of any size. */
function brushScale(game: RiseGame): number {
  "worklet";
  return game.stage.balloonW / BRUSH_FOR_WIDTH;
}

/** A point on screen in a balloon's own points: unturned, unscaled, from its middle. */
function toLocal(b: Balloon, x: number, y: number): { x: number; y: number } {
  "worklet";
  const dx = x - b.x;
  const dy = y - b.y;
  const cos = Math.cos(-b.angle);
  const sin = Math.sin(-b.angle);
  return { x: (dx * cos - dy * sin) / b.scale, y: (dx * sin + dy * cos) / b.scale };
}

/** Whether a balloon's own point is on its body. */
function onBody(game: RiseGame, x: number, y: number): boolean {
  "worklet";
  const rx = game.stage.balloonW / 2;
  const ry = game.stage.balloonH / 2;
  return (x / rx) ** 2 + (y / ry) ** 2 <= 1;
}

/** The balloon under (x, y) that can still be marked — of the pair rising, not yet at the line — or -1. */
function balloonAt(game: RiseGame, x: number, y: number): number {
  "worklet";
  for (let index = 0; index < game.balloons.length; index += 1) {
    const b = game.balloons[index]!;
    if (b.mode !== MODE.rising) continue;
    const pair = game.pairs[b.pair]!;
    if (game.time < pair.start || game.time >= pair.start + RISE.riseMs) continue;
    const at = toLocal(b, x, y);
    if (onBody(game, at.x * HIT, at.y * HIT)) return index;
  }
  return -1;
}

/** Takes all of a balloon's paint off, and the flecks it threw onto the glass. */
function clearPaint(game: RiseGame, index: number): void {
  "worklet";
  const b = game.balloons[index]!;
  b.paint = [];
  b.flecks = [];
  b.tentative = -1;
  b.tentativeFlecks = -1;
  const kept: number[] = [];
  for (let i = 0; i < game.glass.length; i += 4) {
    if (game.glass[i + 3] !== index) kept.push(...game.glass.slice(i, i + 4));
  }
  game.glass = kept;
}

/** Takes back a stroke too short to mark, leaving whatever mark was there before it. */
function dropTentative(b: Balloon): void {
  "worklet";
  if (b.tentative < 0) return;
  b.paint.length = b.tentative;
  b.flecks.length = b.tentativeFlecks;
  b.tentative = -1;
  b.tentativeFlecks = -1;
}

/** A fleck at a balloon's own point: on it, if it's on its body; else on the glass — once it's marked. */
function addFleck(game: RiseGame, index: number, x: number, y: number, r: number): void {
  "worklet";
  const b = game.balloons[index]!;
  if (onBody(game, x, y)) {
    b.flecks.push(x, y, r);
    return;
  }
  if (b.tentative >= 0) return;
  const cos = Math.cos(b.angle);
  const sin = Math.sin(b.angle);
  game.glass.push(
    b.x + (x * cos - y * sin) * b.scale,
    b.y + (x * sin + y * cos) * b.scale,
    r * b.scale,
    index,
  );
}

/**
 * This stroke marks its balloon: it's crossed out — and the other's mark
 * goes. More strokes on a balloon already marked change nothing, its time
 * included.
 */
function confirm(game: RiseGame, index: number): void {
  "worklet";
  const b = game.balloons[index]!;
  const pair = game.pairs[b.pair]!;
  b.tentative = -1;
  b.tentativeFlecks = -1;
  if (pair.marked === b.side) return;
  clearPaint(game, b.side === 0 ? index + 1 : index - 1);
  pair.marked = b.side;
  // Timed from when the stroke landed, not when it had painted far enough: a slow,
  // flourished stroke costs nothing. Only a new choice — the other balloon, or back — moves it.
  pair.markedAt = game.stroke.startedAt - pair.start;
  game.events.marks += 1;
}

/** A stroke arrives on a balloon: a blob where the brush lands, the balloon giving under it. */
function startOn(game: RiseGame, index: number, x: number, y: number): void {
  "worklet";
  const b = game.balloons[index]!;
  b.tentative = b.paint.length;
  b.tentativeFlecks = b.flecks.length;
  const at = toLocal(b, x, y);
  b.paint.push(at.x, at.y, BRUSH.widest * BRUSH.start * brushScale(game), 1);
  b.pokeV += PRESS.begin;
  game.events.touches += 1;
  game.stroke.balloon = index;
  game.stroke.length = 0;
  game.stroke.startedAt = game.time;
}

/** The brush moves on across a balloon: paint, thinner the quicker, flecks thrown ahead. */
function addPoint(game: RiseGame, index: number, x: number, y: number): void {
  "worklet";
  const b = game.balloons[index]!;
  const at = toLocal(b, x, y);
  const last = b.paint.length - 4;
  const dx = at.x - b.paint[last]!;
  const dy = at.y - b.paint[last + 1]!;
  const run = Math.hypot(dx, dy);
  if (run < STEP || b.paint.length >= MOST_POINTS * 4) return;
  const { stroke } = game;
  const even = BRUSH.widest - run * BRUSH.perPoint;
  const width =
    Math.min(BRUSH.widest, Math.max(BRUSH.narrowest, even)) *
    (0.9 + hash01(stroke.count, 5) * 0.2) *
    brushScale(game);
  b.paint.push(at.x, at.y, width, 0);
  stroke.count += 1;
  stroke.length += run;
  b.pokeV += PRESS.per * run;
  b.nudgeV += (dx / run) * PRESS.push;
  if (run >= FLECK.from && hash01(stroke.count, index + 11) * FLECK.odds < run) {
    const ux = dx / run;
    const uy = dy / run;
    const ahead = width * 0.6 + hash01(stroke.count, 2) * FLECK.ahead;
    const aside = (hash01(stroke.count, 3) - 0.5) * width * FLECK.aside;
    const r = FLECK.least + hash01(stroke.count, 4) ** 2 * FLECK.more;
    addFleck(game, index, at.x + ux * ahead - uy * aside, at.y + uy * ahead + ux * aside, r);
  }
  if (b.tentative >= 0 && stroke.length >= RISE.markLength) confirm(game, index);
}

/** The brush leaves a balloon: a short stroke is taken back; a mark flicks off a few last flecks. */
function leave(game: RiseGame): void {
  "worklet";
  const index = game.stroke.balloon;
  const b = game.balloons[index];
  game.stroke.balloon = -1;
  if (!b) return;
  if (b.tentative >= 0) {
    dropTentative(b);
    return;
  }
  const end = b.paint.length - 4;
  if (end < 4) return;
  const dx = b.paint[end]! - b.paint[end - 4]!;
  const dy = b.paint[end + 1]! - b.paint[end - 3]!;
  const run = Math.hypot(dx, dy) || 1;
  for (let i = 0; i < FLICK.count; i += 1) {
    const reach = FLICK.least + hash01(game.stroke.count + i, 9) * FLICK.more;
    const aside = (hash01(game.stroke.count + i, 10) - 0.5) * 6;
    const x = b.paint[end]! + (dx / run) * reach - (dy / run) * aside;
    const y = b.paint[end + 1]! + (dy / run) * reach + (dx / run) * aside;
    addFleck(game, index, x, y, FLECK.least + hash01(i, game.stroke.count) * 1.4);
  }
}

/** A finger comes down: on a balloon that can be marked, the brush lands on it. */
export function beginStroke(game: RiseGame, x: number, y: number): void {
  "worklet";
  if (game.phase !== "play") return;
  game.stroke.balloon = -1;
  game.stroke.lastX = x;
  game.stroke.lastY = y;
  const index = balloonAt(game, x, y);
  if (index >= 0) startOn(game, index, x, y);
}

/** The finger moves: painting the balloon it's on, or leaving it for the other, or for neither. */
export function moveStroke(game: RiseGame, x: number, y: number): void {
  "worklet";
  if (game.phase !== "play") return;
  const index = balloonAt(game, x, y);
  if (index !== game.stroke.balloon) {
    leave(game);
    if (index >= 0) startOn(game, index, x, y);
  } else if (index >= 0) {
    addPoint(game, index, x, y);
  }
  game.stroke.lastX = x;
  game.stroke.lastY = y;
}

/** The finger lifts. */
export function endStroke(game: RiseGame): void {
  "worklet";
  leave(game);
}
