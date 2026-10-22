import { PaintStyle, Skia, type SkCanvas, type SkFont } from "@shopify/react-native-skia";

import { MODE, type Balloon, type RiseGame } from "../logic/rise-rules";
import { hash01 } from "../logic/rise-setup";
import { balloonShapes, drawBalloon, type Look } from "./draw-balloon";

/**
 * How a question went, as a mark: a saved balloon, green and lit as in the
 * game, with ROSE on it — or a burst of black paint with BURST in it. For
 * the list of what was learned.
 */

/** A mark's size, in points. */
export const MARK = { width: 52, height: 70 };

/** The balloon: its body's width, its top's room, its string's length. */
const BALLOON = { width: 44, top: 2, string: 7 };
/** The burst: its heart, its lobes, the drops thrown round it. */
const SPLASH = { core: 17, lobes: 9, drops: 7, seed: 41 };
/** The label's edge, as the game's answers have: a dark line, faint. */
const LABEL_EDGE = { width: 2.4, opacity: 0.45 };
const TAU = Math.PI * 2;

/** The game the mark's balloon is drawn in: its line far below, so the balloon's wholly green. */
function markGame(): RiseGame {
  return {
    phase: "over",
    time: 0,
    stage: {
      width: MARK.width,
      height: MARK.height,
      lineY: MARK.height * 100,
      balloonW: BALLOON.width,
      balloonH: BALLOON.width * 1.2,
      savedScale: 1,
    },
    pairs: [],
    balloons: [],
    drops: [],
    splats: [],
    drips: [],
    scraps: [],
    glass: [],
    gains: [],
    clearAt: -1,
    score: 0,
    stroke: { balloon: -1, lastX: 0, lastY: 0, length: 0, count: 0, startedAt: 0 },
    events: { marks: 0, touches: 0, pops: 0, bursts: 0, saves: 0 },
  };
}

/** The mark's balloon: still, upright, nearest — so it's its full green. */
function markBalloon(game: RiseGame): Balloon {
  return {
    pair: 0,
    side: 0,
    mode: MODE.free,
    label: "",
    x: MARK.width / 2,
    y: BALLOON.top + game.stage.balloonH / 2,
    vx: 0,
    vy: 0,
    angle: 0,
    scale: 1,
    phase: 0.5,
    depth: 1,
    spin: 0,
    poke: 0,
    pokeV: 0,
    nudge: 0,
    nudgeV: 0,
    sx: [],
    sy: [],
    px: [],
    py: [],
    paint: [],
    flecks: [],
    tentative: -1,
    tentativeFlecks: -1,
  };
}

/** A label centred at (x, y), white — with the game's faint dark edge when `edged`. */
function drawLabel(
  canvas: SkCanvas,
  text: string,
  x: number,
  y: number,
  look: Look,
  font: SkFont,
  edged: boolean,
) {
  const bounds = font.measureText(text);
  const left = x - bounds.x - bounds.width / 2;
  const baseline = y - bounds.y - bounds.height / 2;
  if (edged) {
    const edge = Skia.Paint();
    edge.setAntiAlias(true);
    edge.setStyle(PaintStyle.Stroke);
    edge.setStrokeWidth(LABEL_EDGE.width);
    edge.setColor(Skia.Color(look.words));
    edge.setAlphaf(LABEL_EDGE.opacity);
    canvas.drawText(text, left, baseline, edge, font);
  }
  const fill = Skia.Paint();
  fill.setAntiAlias(true);
  fill.setColor(Skia.Color(look.glass));
  canvas.drawText(text, left, baseline, fill, font);
}

/** A question that rose: a saved balloon, its string short under it, ROSE across it. */
export function drawRoseMark(canvas: SkCanvas, look: Look, font: SkFont): void {
  const game = markGame();
  const b = markBalloon(game);
  const knot = b.y + game.stage.balloonH / 2 + 5;
  const string = Skia.Paint();
  string.setAntiAlias(true);
  string.setStyle(PaintStyle.Stroke);
  string.setStrokeWidth(1);
  string.setColor(Skia.Color(look.ink));
  string.setAlphaf(0.5);
  const path = Skia.Path.Make();
  path.moveTo(b.x, knot);
  path.quadTo(b.x + 3, knot + BALLOON.string / 2, b.x - 1, knot + BALLOON.string);
  canvas.drawPath(path, string);
  drawBalloon(canvas, b, game, look, balloonShapes(game.stage));
  drawLabel(canvas, "ROSE", b.x, b.y - 2, look, font, true);
}

/** A question that burst: a splash of black paint, lobed, drops round it, BURST in it. */
export function drawBurstMark(canvas: SkCanvas, look: Look, font: SkFont): void {
  const x = MARK.width / 2;
  const y = MARK.height / 2 - 2;
  const splash = Skia.Path.Make();
  splash.addCircle(x, y, SPLASH.core);
  for (let i = 0; i < SPLASH.lobes; i += 1) {
    const angle = (i / SPLASH.lobes + hash01(SPLASH.seed, i) * 0.08) * TAU;
    const out = SPLASH.core * (0.75 + hash01(SPLASH.seed, i + 20) * 0.4);
    const r = SPLASH.core * (0.3 + hash01(SPLASH.seed, i + 40) * 0.2);
    splash.addCircle(x + Math.cos(angle) * out, y + Math.sin(angle) * out, r);
  }
  for (let i = 0; i < SPLASH.drops; i += 1) {
    const angle = hash01(SPLASH.seed, i + 60) * TAU;
    const out = SPLASH.core * (1.45 + hash01(SPLASH.seed, i + 80) * 0.25);
    splash.addCircle(
      x + Math.cos(angle) * out,
      y + Math.sin(angle) * out,
      1 + hash01(SPLASH.seed, i + 90) * 1.6,
    );
  }
  const ink = Skia.Paint();
  ink.setAntiAlias(true);
  ink.setColor(Skia.Color(look.ink));
  canvas.drawPath(splash, ink);
  drawLabel(canvas, "BURST", x, y, look, font, false);
}
