import {
  ClipOp,
  Skia,
  type SkCanvas,
  type SkFont,
  type SkPath,
  type SkPathBuilder,
} from "@shopify/react-native-skia";

import type { Balloon, RiseGame, Stage } from "../logic/rise-rules";
import { hash01 } from "../logic/rise-setup";
import { BODY, bodyStretch } from "../logic/rise-shape";
import { skinShader, type Rgb } from "./balloon-shader";
import { drawWords } from "./draw-words";

/**
 * One balloon, drawn in its own points — turned, squashed by a touch, a
 * little lopsided — its skin lit (`skinShader`), the paint crossing it out
 * on its surface, lit the same and kept inside its outline, and its answer
 * across its middle: white, with a dark edge so it still reads where it's
 * painted over. Worklets, each after what it calls.
 */

/** The colours and face the board is drawn in. */
export type Look = {
  red: Rgb;
  green: Rgb;
  paint: Rgb;
  /** The page. */
  paper: string;
  ink: string;
  glass: string;
  scrap: string;
  words: string;
  font: SkFont | null;
  /** The time a saved pair kept, as it rises off it: the saved green. */
  gain: string;
  /** How much the answers are blurred, in their own points: 0, sharp; a share's, just past reading. */
  blur: number;
};

/** How far a saved balloon's green fades toward white with distance: the farthest, this much. */
const HAZE = 0.16;
/** How dull paint is next to the balloon's shine. */
const PAINT_GLOSS = 0.3;
/** How much paint keeps its white against the balloon's shading. */
const PAINT_MATTE = 0.65;
/** The brush's tail thins over its last three points; dry bristle marks trail past it. */
const TAIL = [0.85, 0.65, 0.45];
const BRISTLES = { rows: 3, marks: 3, apart: 4, size: 0.08 };

/** A balloon's outline (`BODY`, the shape its touches use too) and knot, in its own points, centred on its body. */
export function balloonShapes(stage: Stage): { body: SkPath; knot: SkPath } {
  "worklet";
  const rx = stage.balloonW / 2;
  const ry = stage.balloonH / 2;
  const body = Skia.PathBuilder.Make();
  body.moveTo(BODY.start[0] * rx, BODY.start[1] * ry);
  for (const c of BODY.curves) {
    body.cubicTo(c[0] * rx, c[1] * ry, c[2] * rx, c[3] * ry, c[4] * rx, c[5] * ry);
  }
  body.close();
  const knot = Skia.PathBuilder.Make();
  knot.moveTo(-3.5, ry + 5);
  knot.lineTo(3.5, ry + 5);
  knot.lineTo(1.2, ry - 1);
  knot.lineTo(-1.2, ry - 1);
  knot.close();
  return { body: body.detach(), knot: knot.detach() };
}

/** Dabs of the brush no further apart than this share of its width: a solid stroke, edges just uneven. */
const DAB_SPACING = 0.3;

/**
 * One stroke of paint, `from` to `to` (points of four numbers): the brush's
 * dabs, close enough to run solid, each a touch wider or narrower — a blob
 * where it landed, thinning over its tail, dry bristle marks trailing past.
 */
function addStroke(path: SkPathBuilder, paint: number[], from: number, to: number): void {
  "worklet";
  const count = to - from;
  const x = (i: number) => paint[(from + i) * 4]!;
  const y = (i: number) => paint[(from + i) * 4 + 1]!;
  const radius = (i: number) => {
    const taper = i >= count - TAIL.length ? (TAIL.at(i - (count - TAIL.length)) ?? 1) : 1;
    return (paint[(from + i) * 4 + 2]! / 2) * taper * (0.92 + hash01(i, from) * 0.16);
  };
  path.addCircle(x(0), y(0), radius(0));
  for (let i = 1; i < count; i += 1) {
    const run = Math.hypot(x(i) - x(i - 1), y(i) - y(i - 1));
    const dabs = Math.max(
      1,
      Math.ceil(run / (Math.min(radius(i), radius(i - 1)) * 2 * DAB_SPACING)),
    );
    for (let dab = 1; dab <= dabs; dab += 1) {
      const t = dab / dabs;
      path.addCircle(
        x(i - 1) + (x(i) - x(i - 1)) * t,
        y(i - 1) + (y(i) - y(i - 1)) * t,
        radius(i - 1) + (radius(i) - radius(i - 1)) * t,
      );
    }
  }
  if (count < 2) return;
  const ex = x(count - 1) - x(count - 2);
  const ey = y(count - 1) - y(count - 2);
  const run = Math.hypot(ex, ey) || 1;
  const w = paint[(from + count - 1) * 4 + 2]!;
  for (let row = 0; row < BRISTLES.rows; row += 1) {
    const aside = (row - 1) * w * 0.28;
    for (let mark = 1; mark <= BRISTLES.marks; mark += 1) {
      if (hash01(row * 7 + mark, from) < 0.3) continue;
      const along = mark * BRISTLES.apart;
      path.addCircle(
        x(count - 1) + (ex / run) * along - (ey / run) * aside,
        y(count - 1) + (ey / run) * along + (ex / run) * aside,
        w * BRISTLES.size * (1 - mark / (BRISTLES.marks + 1)) + 0.4,
      );
    }
  }
}

/** All of a balloon's paint, and its flecks, as one shape. */
function paintPath(b: Balloon): SkPath {
  "worklet";
  const path = Skia.PathBuilder.Make();
  const points = b.paint.length / 4;
  let start = 0;
  for (let i = 1; i <= points; i += 1) {
    if (i === points || b.paint[i * 4 + 3] === 1) {
      addStroke(path, b.paint, start, i);
      start = i;
    }
  }
  for (let i = 0; i < b.flecks.length; i += 3) {
    path.addCircle(b.flecks[i]!, b.flecks[i + 1]!, b.flecks[i + 2]!);
  }
  return path.detach();
}

/** A colour faded `share` of the way to white: farther off, paler. */
function hazed([red, green, blue]: Rgb, share: number): Rgb {
  "worklet";
  return [red + (1 - red) * share, green + (1 - green) * share, blue + (1 - blue) * share];
}

/** One balloon, where it is: skin, paint and words. */
export function drawBalloon(
  canvas: SkCanvas,
  b: Balloon,
  game: RiseGame,
  look: Look,
  shapes: { body: SkPath; knot: SkPath },
): void {
  "worklet";
  const { stage } = game;
  const skin = {
    halfW: stage.balloonW / 2,
    halfH: stage.balloonH / 2,
    ink: look.red,
    saved: hazed(look.green, (1 - b.depth) * HAZE),
    lineY: stage.lineY,
    centerY: b.y,
    turn: b.angle,
    scale: b.scale,
    gloss: 1,
    matte: 0,
  };
  const shader = skinShader(skin);
  const skinPaint = Skia.Paint();
  skinPaint.setAntiAlias(true);
  if (shader) skinPaint.setShader(shader);
  else skinPaint.setColor(Skia.Color(look.scrap));
  canvas.save();
  canvas.translate(b.x, b.y);
  canvas.rotate((b.angle * 180) / Math.PI, 0, 0);
  const stretch = bodyStretch(b);
  canvas.scale(stretch.x, stretch.y);
  canvas.drawPath(shapes.knot, skinPaint);
  canvas.drawPath(shapes.body, skinPaint);
  if (b.paint.length > 0) {
    const paintShader = skinShader({
      ...skin,
      ink: look.paint,
      saved: look.paint,
      gloss: PAINT_GLOSS,
      matte: PAINT_MATTE,
    });
    const brush = Skia.Paint();
    brush.setAntiAlias(true);
    if (paintShader) brush.setShader(paintShader);
    else brush.setColor(Skia.Color(look.glass));
    canvas.save();
    canvas.clipPath(shapes.body, ClipOp.Intersect, true);
    canvas.drawPath(paintPath(b), brush);
    canvas.restore();
  }
  drawWords(canvas, b, stage, look);
  canvas.restore();
}
