import {
  BlurStyle,
  PaintStyle,
  Skia,
  type SkCanvas,
  type SkPaint,
  type SkPath,
} from "@shopify/react-native-skia";

import { MODE, RISE, STRING_POINTS, type Balloon, type RiseGame } from "../logic/rise-rules";
import { hash01 } from "../logic/rise-setup";
import { balloonShapes, drawBalloon, type Look } from "./draw-balloon";

/**
 * The whole board, one frame, back to front: the atmosphere's line; the
 * paint that's landed, and the drips running from it; white flecks on the
 * glass; scraps at rest; the saved balloons far to near, each over its own
 * string; the other strings; the rising ones, each over a faint shadow; scraps still falling; and drops in the
 * air, over everything; last, each saved pair's time kept, rising off it.
 * Worklets, each after what it calls.
 */

const TAU = Math.PI * 2;
/** The line: a hairline, faint. */
const LINE = { width: 1, opacity: 0.22 };
/** Strings: fine and soft. */
const STRING = { width: 1.1, opacity: 0.5 };
/** A balloon's shadow: faint, soft, below and to the right of the light. */
const SHADOW = { opacity: 0.07, blur: 9, dx: 4, dy: 8, size: 0.45 };
/**
 * Time kept, rising off a saved pair: how far it rises, from when it starts
 * to fade (a share of its life), its plus — drawn, as the face has none —
 * as a share of the face's size, and the room after it.
 */
const GAIN = { above: 10, rise: 44, fadeFrom: 0.6, plus: 0.5, bar: 0.12, room: 0.12 };
/** A scrap's corners, and how flat it lies caught on the line. */
const SCRAP = { corners: 7, draped: 0.55 };

function paintOf(color: string, opacity = 1) {
  "worklet";
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setColor(Skia.Color(color));
  paint.setAlphaf(opacity);
  return paint;
}

/** The line between the atmosphere and the field. */
function drawLine(canvas: SkCanvas, game: RiseGame, look: Look): void {
  "worklet";
  const paint = paintOf(look.ink, LINE.opacity);
  paint.setStrokeWidth(LINE.width);
  canvas.drawLine(0, game.stage.lineY, game.stage.width, game.stage.lineY, paint);
}

/** Landed paint — each splat stretched the way it hit — and its drips. */
function drawSplats(canvas: SkCanvas, game: RiseGame, look: Look): void {
  "worklet";
  const path = Skia.Path.Make();
  const { splats, drips } = game;
  for (let i = 0; i < splats.length; i += 5) {
    const [x, y, r, sx, sy] = [
      splats[i]!,
      splats[i + 1]!,
      splats[i + 2]!,
      splats[i + 3]!,
      splats[i + 4]!,
    ];
    path.addCircle(x, y, r);
    if (sx !== 0 || sy !== 0) {
      path.addCircle(x + sx * 0.5, y + sy * 0.5, r * 0.75);
      path.addCircle(x + sx, y + sy, r * 0.5);
    }
  }
  for (let i = 0; i < drips.length; i += 5) {
    const [x, top, length, , width] = [drips[i]!, drips[i + 1]!, drips[i + 2]!, 0, drips[i + 4]!];
    if (length <= 0) continue;
    path.addRRect(
      Skia.RRectXY(Skia.XYWHRect(x - width / 2, top, width, length), width / 2, width / 2),
    );
    path.addCircle(x, top + length, width * 0.7);
  }
  canvas.drawPath(path, paintOf(look.ink));
}

/** White flecks thrown past a balloon's edge, on the glass. */
function drawGlass(canvas: SkCanvas, game: RiseGame, look: Look): void {
  "worklet";
  const path = Skia.Path.Make();
  for (let i = 0; i < game.glass.length; i += 4) {
    path.addCircle(game.glass[i]!, game.glass[i + 1]!, game.glass[i + 2]!);
  }
  canvas.drawPath(path, paintOf(look.glass));
}

/** Scraps of latex, at rest or still falling: crumpled, matte, a fold across each. */
function drawScraps(canvas: SkCanvas, game: RiseGame, look: Look, resting: boolean): void {
  "worklet";
  const skin = Skia.Path.Make();
  const folds = Skia.Path.Make();
  for (const scrap of game.scraps) {
    if ((scrap.rest !== 0) !== resting) continue;
    const flat = scrap.rest === 1 ? SCRAP.draped : 1;
    for (let k = 0; k < SCRAP.corners; k += 1) {
      const angle = (k / SCRAP.corners) * TAU + scrap.angle;
      const reach = scrap.size * (0.32 + hash01(scrap.seed, k) * 0.3);
      const x = scrap.x + Math.cos(angle) * reach;
      const y = scrap.y + Math.sin(angle) * reach * flat;
      if (k === 0) skin.moveTo(x, y);
      else skin.lineTo(x, y);
    }
    skin.close();
    folds.moveTo(scrap.x, scrap.y);
    folds.lineTo(
      scrap.x + Math.cos(scrap.angle) * scrap.size * 0.4,
      scrap.y + Math.sin(scrap.angle) * scrap.size * 0.4 * flat,
    );
  }
  canvas.drawPath(skin, paintOf(look.scrap));
  const fold = paintOf(look.ink, 0.25);
  fold.setStyle(PaintStyle.Stroke);
  fold.setStrokeWidth(1);
  canvas.drawPath(folds, fold);
}

/** A balloon's string, smoothed through its points. */
function addString(path: SkPath, b: Balloon): void {
  "worklet";
  path.moveTo(b.sx[0]!, b.sy[0]!);
  for (let i = 1; i < STRING_POINTS - 1; i += 1) {
    const midX = (b.sx[i]! + b.sx[i + 1]!) / 2;
    const midY = (b.sy[i]! + b.sy[i + 1]!) / 2;
    path.quadTo(b.sx[i]!, b.sy[i]!, midX, midY);
  }
  path.lineTo(b.sx[STRING_POINTS - 1]!, b.sy[STRING_POINTS - 1]!);
}

/** Strings: every balloon's in `only`'s place, or just `only`'s — a saved one's, at its depth. */
function drawStrings(canvas: SkCanvas, game: RiseGame, look: Look, only: Balloon | null): void {
  "worklet";
  const path = Skia.Path.Make();
  if (only) addString(path, only);
  else {
    for (const b of game.balloons) {
      if (b.mode === MODE.waiting || b.mode === MODE.gone || b.mode === MODE.free) continue;
      addString(path, b);
    }
  }
  const paint = paintOf(look.ink, STRING.opacity);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(STRING.width);
  canvas.drawPath(path, paint);
}

/** One balloon over its faint shadow. */
function drawWithShadow(
  canvas: SkCanvas,
  b: Balloon,
  game: RiseGame,
  look: Look,
  shapes: ReturnType<typeof balloonShapes>,
  shadow: SkPaint,
): void {
  "worklet";
  const rx = game.stage.balloonW * SHADOW.size * b.scale;
  const ry = game.stage.balloonH * SHADOW.size * b.scale;
  canvas.drawOval(
    Skia.XYWHRect(b.x + SHADOW.dx - rx, b.y + SHADOW.dy - ry, rx * 2, ry * 2),
    shadow,
  );
  drawBalloon(canvas, b, game, look, shapes);
}

/** Black drops still in the air. */
function drawDrops(canvas: SkCanvas, game: RiseGame, look: Look): void {
  "worklet";
  const path = Skia.Path.Make();
  for (const drop of game.drops) path.addCircle(drop.x, drop.y, drop.r);
  canvas.drawPath(path, paintOf(look.ink));
}

/** Each saved pair's "+2.9s", over its balloon's top as it crosses, drifting up off it and fading. */
function drawGains(canvas: SkCanvas, game: RiseGame, look: Look): void {
  "worklet";
  const font = look.font;
  if (!font) return;
  const size = font.getSize();
  for (let i = 0; i < game.gains.length; i += 4) {
    const life = (game.time - game.gains[i + 2]!) / RISE.gainMs;
    if (life < 0 || life >= 1) continue;
    const words = `${(game.gains[i + 3]! / 1000).toFixed(1)}s`;
    const bounds = font.measureText(words);
    const plus = size * GAIN.plus;
    const b = game.balloons[game.gains[i]!];
    if (!b) continue;
    const top = b.y - (game.stage.balloonH / 2) * b.scale;
    const left = b.x - (plus + size * GAIN.room + bounds.width) / 2;
    const baseline = top - GAIN.above - GAIN.rise * (1 - (1 - life) ** 3);
    const paint = paintOf(look.gain, life < GAIN.fadeFrom ? 1 : (1 - life) / (1 - GAIN.fadeFrom));
    const middle = baseline - bounds.height / 2;
    const bar = size * GAIN.bar;
    canvas.drawRect(Skia.XYWHRect(left, middle - bar / 2, plus, bar), paint);
    canvas.drawRect(Skia.XYWHRect(left + plus / 2 - bar / 2, middle - plus / 2, bar, plus), paint);
    canvas.drawText(words, left + plus + size * GAIN.room - bounds.x, baseline, paint, font);
  }
}

/** The board as it stands, drawn on `canvas`. */
export function drawRise(canvas: SkCanvas, game: RiseGame, look: Look): void {
  "worklet";
  const shapes = balloonShapes(game.stage);
  drawLine(canvas, game, look);
  drawSplats(canvas, game, look);
  drawGlass(canvas, game, look);
  drawScraps(canvas, game, look, true);
  const shadow = paintOf(look.ink, SHADOW.opacity);
  shadow.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, SHADOW.blur, true));
  // The saved, far to near, each over its own string: nearer ones pass in front.
  const saved = game.balloons.filter((b) => b.mode === MODE.free).sort((a, b) => a.depth - b.depth);
  for (const b of saved) {
    drawStrings(canvas, game, look, b);
    drawWithShadow(canvas, b, game, look, shapes, shadow);
  }
  drawStrings(canvas, game, look, null);
  for (const b of game.balloons) {
    if (b.mode === MODE.rising || b.mode === MODE.crossing) {
      drawWithShadow(canvas, b, game, look, shapes, shadow);
    }
  }
  drawScraps(canvas, game, look, false);
  drawDrops(canvas, game, look);
  drawGains(canvas, game, look);
}
