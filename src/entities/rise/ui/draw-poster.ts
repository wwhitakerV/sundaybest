import { ClipOp, Skia, type SkCanvas, type SkFont, type SkPaint } from "@shopify/react-native-skia";

import type { RiseGame } from "../logic/rise-rules";
import type { Look } from "./draw-balloon";
import { drawRise } from "./draw-scene";

/**
 * A finished board as a poster to share: the board itself — balloons,
 * strings, paint, latex — on white, its answers blurred just past reading,
 * over a black band with the score in Canela, the time to spare opposite
 * it, and the day. Either a post
 * (4:5), cropped to what happened, or a story (9:16), the whole board.
 */

/** The two shapes a poster comes in, in pixels, and the black band at its foot. */
export const POSTER = {
  post: { width: 1080, height: 1350, band: 300 },
  story: { width: 1080, height: 1920, band: 400 },
};

export type PosterFormat = keyof typeof POSTER;

/** Under the time, what it is. */
const SPARE_NOTE = "TO SPARE";
/** The answers' blur, in their own points: the words still there, no longer readable. */
const ANSWER_BLUR = 4.2;
/** Room kept round what happened, below the lowest paint (board points). */
const ROOM_BELOW = 28;
/** A post shows at least the atmosphere and a little under its line, though nothing burst. */
const LEAST_BELOW_LINE = 0.3;
/** The band's words: in from the left, from the band's top; the label tracked, faded. */
const BAND = {
  inset: 84,
  top: 72,
  apart: 76,
  tracking: 0.12,
  labelFade: 0.62,
  /** The dot between the label's parts: its size, how high, the room either side (of the face's size). */
  dot: 0.09,
  dotHeight: 0.36,
  dotRoom: 0.55,
};

/** How far down the board anything happened: the lowest paint, drip, scrap or fleck. */
function lowestMark(game: RiseGame): number {
  const { stage, splats, drips, scraps, glass } = game;
  let lowest = stage.lineY + stage.balloonH * LEAST_BELOW_LINE;
  for (let i = 0; i < splats.length; i += 5) {
    lowest = Math.max(lowest, splats[i + 1]! + splats[i + 2]! + Math.abs(splats[i + 4]!));
  }
  for (let i = 0; i < drips.length; i += 5) {
    lowest = Math.max(lowest, drips[i + 1]! + drips[i + 2]! + drips[i + 4]!);
  }
  for (const scrap of scraps) lowest = Math.max(lowest, scrap.y + scrap.size / 2);
  for (let i = 0; i < glass.length; i += 4)
    lowest = Math.max(lowest, glass[i + 1]! + glass[i + 2]!);
  return Math.min(stage.height, lowest + ROOM_BELOW);
}

function fillOf(color: string, opacity = 1): SkPaint {
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setColor(Skia.Color(color));
  paint.setAlphaf(opacity);
  return paint;
}

/** One part's advance, letter by letter, `tracking` of the face's size apart. */
function partWidth(part: string, font: SkFont): number {
  let across = 0;
  for (const letter of part) {
    const [advance = 0] = font.getGlyphWidths(font.getGlyphIDs(letter));
    across += advance + font.getSize() * BAND.tracking;
  }
  return across;
}

/**
 * Words set letter by letter, `tracking` of the face's size apart, the
 * parts parted by a dot — drawn, as the label's face hasn't one.
 */
function drawTracked(
  canvas: SkCanvas,
  parts: string[],
  x: number,
  y: number,
  font: SkFont,
  paint: SkPaint,
) {
  const size = font.getSize();
  let at = x;
  parts.forEach((part, index) => {
    if (index > 0) {
      at += size * BAND.dotRoom;
      canvas.drawCircle(at, y - size * BAND.dotHeight, size * BAND.dot, paint);
      at += size * BAND.dotRoom;
    }
    for (const letter of part) {
      canvas.drawText(letter, at, y, paint, font);
      const [advance = 0] = font.getGlyphWidths(font.getGlyphIDs(letter));
      at += advance + size * BAND.tracking;
    }
  });
}

/** The poster, drawn on `canvas` at its full size. */
export function drawPoster(
  canvas: SkCanvas,
  game: RiseGame,
  look: Look,
  faces: { score: SkFont | null; time: SkFont | null; label: SkFont | null },
  format: PosterFormat,
  words: { score: string; time: string; label: string[] },
): void {
  const { width, height, band } = POSTER[format];
  const { stage } = game;
  const area = height - band;
  canvas.drawRect(Skia.XYWHRect(0, 0, width, area), fillOf(look.paper));
  const shown = format === "story" ? stage.height : lowestMark(game);
  const scale = Math.min(width / stage.width, area / shown);
  canvas.save();
  canvas.clipRect(Skia.XYWHRect(0, 0, width, area), ClipOp.Intersect, true);
  canvas.translate((width - stage.width * scale) / 2, (area - shown * scale) / 2);
  canvas.scale(scale, scale);
  drawRise(canvas, game, { ...look, blur: ANSWER_BLUR });
  canvas.restore();
  canvas.drawRect(Skia.XYWHRect(0, area, width, band), fillOf(look.ink));
  if (faces.score) {
    const baseline = area + BAND.top + faces.score.getSize() * 0.72;
    canvas.drawText(words.score, BAND.inset, baseline, fillOf(look.glass), faces.score);
    if (faces.time) {
      const [first = 0, ...rest] = faces.time.getGlyphWidths(faces.time.getGlyphIDs(words.time));
      const across = rest.reduce((sum, part) => sum + part, first);
      const timeX = width - BAND.inset - across;
      canvas.drawText(words.time, timeX, baseline, fillOf(look.glass, BAND.labelFade), faces.time);
      if (faces.label) {
        // What the time is, under it — the tracking's last gap left off, so it ends flush.
        const noteX =
          width -
          BAND.inset -
          partWidth(SPARE_NOTE, faces.label) +
          faces.label.getSize() * BAND.tracking;
        const paint = fillOf(look.glass, BAND.labelFade);
        drawTracked(canvas, [SPARE_NOTE], noteX, baseline + BAND.apart, faces.label, paint);
      }
    }
    if (faces.label) {
      const paint = fillOf(look.glass, BAND.labelFade);
      drawTracked(canvas, words.label, BAND.inset, baseline + BAND.apart, faces.label, paint);
    }
  }
}
