import { Skia, type SkPath, type SkRect } from "@shopify/react-native-skia";

import { mix } from "../logic/flock-geometry";
import {
  BAND,
  BOARD,
  CALL,
  COUNTDOWN_MS,
  GATE,
  SHEEP,
  SHEEP_STATE,
  type FlockGame,
} from "../logic/flock-rules";
import { countdownShare } from "../logic/flock-step";

/**
 * The board's shapes, built each frame on the UI thread from the game as it
 * stands, scaled to the screen. Worklets, each after what it calls.
 */

/** How near the wolf a sheep starts to redden, and how far its eyes reach when it's weighing up. */
const DANGER = 240;
const VISION = { length: 260, widest: 0.62 };
/**
 * The wolf as drawn: larger than where it catches (`WOLF.radius`), so its
 * countdown fits inside it — a jagged star, this many points, the inner ones
 * this far in.
 */
export const WOLF_DRAWN = 44;
const WOLF_POINTS = 9;
const WOLF_INNER = 0.62;
/** Each number of the countdown flashes: whole for this share of its second, then fading. */
const DIGIT_HOLD = 0.55;

/** How much a field sheep has reddened: none, until the wolf comes near in play. */
function danger(game: FlockGame, x: number, y: number): number {
  "worklet";
  if (game.phase !== "play") return 0;
  return Math.max(0, 1 - Math.hypot(x - game.wolf.x, y - game.wolf.y) / DANGER);
}

/** The field's sheep whose reddening falls in [least, most) — so a few paths can carry every shade. */
export function fieldSheep(game: FlockGame, scale: number, least: number, most: number): SkPath {
  "worklet";
  const path = Skia.Path.Make();
  for (const sheep of game.sheep) {
    if (sheep.state !== SHEEP_STATE.field) continue;
    const red = danger(game, sheep.x, sheep.y);
    if (red < least || red >= most) continue;
    path.addCircle(sheep.x * scale, sheep.y * scale, SHEEP.radius * scale);
  }
  return path;
}

/** The saved, in the band: red dots in their places. */
export function savedSheep(game: FlockGame, scale: number): SkPath {
  "worklet";
  const path = Skia.Path.Make();
  for (const sheep of game.sheep) {
    if (sheep.state !== SHEEP_STATE.saved) continue;
    path.addCircle(sheep.x * scale, sheep.y * scale, SHEEP.radius * scale);
  }
  return path;
}

/** The faint line between the band and the field. */
export function bandLine(scale: number): SkPath {
  "worklet";
  const path = Skia.Path.Make();
  path.moveTo(0, BAND * scale);
  path.lineTo(BOARD.width * scale, BAND * scale);
  return path;
}

/** The gate: a thick bar on the band's line, where it's been slid to. */
export function gateBar(game: FlockGame, scale: number): SkPath {
  "worklet";
  const path = Skia.Path.Make();
  path.addRect(
    Skia.XYWHRect(
      (game.gateX - GATE.width / 2) * scale,
      (BAND - GATE.thickness / 2) * scale,
      GATE.width * scale,
      GATE.thickness * scale,
    ),
  );
  return path;
}

/** The wolf, as a jagged star where it stands. */
export function wolfShape(game: FlockGame, scale: number): SkPath {
  "worklet";
  const path = Skia.Path.Make();
  for (let i = 0; i < WOLF_POINTS * 2; i += 1) {
    const angle = (i / (WOLF_POINTS * 2)) * Math.PI * 2;
    const reach = (i % 2 === 0 ? 1 : WOLF_INNER) * WOLF_DRAWN * scale;
    const x = game.wolf.x * scale + Math.cos(angle) * reach;
    const y = game.wolf.y * scale + Math.sin(angle) * reach;
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  path.close();
  return path;
}

/** How far up the wolf its red has risen, on screen: its foot before the countdown, its top once done. */
function fillLine(game: FlockGame, scale: number): number {
  "worklet";
  return (game.wolf.y + WOLF_DRAWN - 2 * WOLF_DRAWN * countdownShare(game)) * scale;
}

/** The part of the wolf filled red: below its rising line. */
export function wolfFilled(game: FlockGame, scale: number): SkRect {
  "worklet";
  const top = fillLine(game, scale);
  const left = (game.wolf.x - WOLF_DRAWN) * scale;
  return Skia.XYWHRect(left, top, WOLF_DRAWN * 2 * scale, (game.wolf.y + WOLF_DRAWN) * scale - top);
}

/** The part of the wolf still hollow: above its rising line. */
export function wolfHollow(game: FlockGame, scale: number): SkRect {
  "worklet";
  const top = (game.wolf.y - WOLF_DRAWN) * scale;
  const left = (game.wolf.x - WOLF_DRAWN) * scale;
  return Skia.XYWHRect(left, top, WOLF_DRAWN * 2 * scale, fillLine(game, scale) - top);
}

/** The countdown's number, 3, 2, 1 — none before it or after. */
export function countdownDigit(game: FlockGame): string {
  "worklet";
  if (game.phase !== "countdown") return "";
  return String(Math.max(1, Math.ceil((COUNTDOWN_MS - game.countdown) / 1000)));
}

/** How much of the number shows: whole as it lands, fading before the next. */
export function digitOpacity(game: FlockGame): number {
  "worklet";
  if (game.phase !== "countdown") return 0;
  const into = (game.countdown % 1000) / 1000;
  return into < DIGIT_HOLD ? 1 : (1 - into) / (1 - DIGIT_HOLD);
}

/**
 * The wolf's eyes: two dashed rays in a V, wide while it weighs up a group,
 * narrowing as it settles — and, locked on, one line to its sheep. Only in play.
 */
export function wolfVision(game: FlockGame, scale: number): SkPath {
  "worklet";
  const path = Skia.Path.Make();
  const { wolf } = game;
  if (game.phase !== "play" || wolf.target < 0) return path;
  const x = wolf.x * scale;
  const y = wolf.y * scale;
  if (wolf.focus >= 1) {
    const sheep = game.sheep[wolf.target]!;
    path.moveTo(x, y);
    path.lineTo(sheep.x * scale, sheep.y * scale);
    return path;
  }
  const half = mix(VISION.widest, 0.05, wolf.focus);
  for (const side of [-1, 1]) {
    path.moveTo(x, y);
    path.lineTo(
      x + Math.cos(wolf.heading + side * half) * VISION.length * scale,
      y + Math.sin(wolf.heading + side * half) * VISION.length * scale,
    );
  }
  return path;
}

/** The `slot`th call wave, spreading as it ages — or nothing. */
export function ring(game: FlockGame, slot: number, scale: number): SkPath {
  "worklet";
  const path = Skia.Path.Make();
  const wave = game.rings.at(slot);
  if (!wave) return path;
  const grown = (game.time - wave.bornAt) / CALL.ringMs;
  path.addCircle(wave.x * scale, wave.y * scale, Math.max(1, grown * wave.reach * scale));
  return path;
}

/** How much of the `slot`th wave is left as it spreads. */
export function ringOpacity(game: FlockGame, slot: number): number {
  "worklet";
  const wave = game.rings.at(slot);
  if (!wave) return 0;
  return Math.max(0, 1 - (game.time - wave.bornAt) / CALL.ringMs) * 0.5;
}
