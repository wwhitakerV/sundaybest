import {
  BlendMode,
  PaintStyle,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
  type SkImageFilter,
  type SkPaint,
  type SkPath,
  type SkRect,
  type SkRuntimeEffect,
} from "@shopify/react-native-skia";

import { unionBox } from "../../logic/water/pixels";
import { LETTERS, PEN_WIDTH, STROKES } from "../../logic/wordmark";
import { DROPS_SKSL } from "./glass-sksl";
import { LETTER_SKSL } from "./letter-sksl";
import { POOL_SKSL } from "./pool-sksl";
import { bakeWaterTextures, compile, type WaterTextures } from "./water-textures";

/**
 * The liquid look: blurred, then its edges cut hard by an alpha threshold, so
 * shapes close together melt into one another like water.
 */
const LIQUID_BLUR = 3.5;
const LIQUID_THRESHOLD = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 18, -7];

/** What the water intro draws with, made once. */
export type WaterAssets = {
  letters: SkPath[];
  /** Each letter's region, in its own units: its outline with room around it and below, for its streams. */
  regions: SkRect[];
  /** The whole word's region, in its units: where the letters' living water is laid. */
  word: SkRect;
  /** Every pen line, in writing order, and which letter each belongs to. */
  strokes: SkPath[];
  strokeLetter: number[];
  effects: { pool: SkRuntimeEffect; drops: SkRuntimeEffect; letter: SkRuntimeEffect };
  textures: WaterTextures;
  /**
   * The pool's shape: what's drawn into it, merged like liquid — in the screen's
   * pixels, and cut at the screen's edge, so water running off it reads as
   * carrying on beyond it, never as an edge of its own.
   */
  liquid: SkImageFilter;
  /** The red the pool starts as: the launch's ink, as an SkSL colour. */
  red: number[];
  /** A shape's fill: only its coverage matters, the glass gives it its look. */
  fill: SkPaint;
  /** The pen, as a mask: a round-ended line. */
  pen: SkPaint;
  /** A letter's fill coming in under its pen lines; its opacity changes frame to frame. */
  ink: SkPaint;
  /** Keeps what's under it only where it's drawn: the pen's mask over a letter being written. */
  mask: SkPaint;
  /** Each frame's layer paints: their filters change frame to frame. */
  layer: { pool: SkPaint; drops: SkPaint; letter: SkPaint; melt: SkPaint };
  /** Too faint to show anywhere: puts each filter to work before the intro starts. */
  faint: SkPaint;
};

/** A shape's fill, in the launch's ink: only its coverage matters, the glass gives it its look. */
function filled(colour: string): SkPaint {
  const paint = Skia.Paint();
  paint.setColor(Skia.Color(colour));
  paint.setAntiAlias(true);
  return paint;
}

/**
 * The water intro's paths, shaders, textures and paints, with the pool starting
 * in `red`, for a screen `stage` points across at `pr` pixels to the point.
 */
export function makeWaterAssets(
  red: string,
  pr: number,
  stage: { width: number; height: number },
): WaterAssets {
  const path = (d: string) => Skia.Path.MakeFromSVGString(d) ?? Skia.Path.Make();
  const letters = LETTERS.map(path);
  const regions = letters.map((letter) => {
    const box = letter.computeTightBounds();
    return Skia.XYWHRect(box.x - 1, box.y - 1, box.width + 2, box.height + 9);
  });
  const whole = unionBox(regions) ?? { x: 0, y: 0, width: 1, height: 1 };

  const pen = filled(red);
  pen.setStyle(PaintStyle.Stroke);
  pen.setStrokeWidth(PEN_WIDTH);
  pen.setStrokeCap(StrokeCap.Round);
  pen.setStrokeJoin(StrokeJoin.Round);
  const mask = Skia.Paint();
  mask.setBlendMode(BlendMode.DstIn);
  const faint = filled(red);
  faint.setAlphaf(0.01);
  const colour = Skia.Color(red);

  return {
    letters,
    regions,
    word: Skia.XYWHRect(whole.x, whole.y, whole.width, whole.height),
    strokes: STROKES.flatMap((lines) => lines.map(path)),
    strokeLetter: STROKES.flatMap((lines, li) => lines.map(() => li)),
    effects: {
      pool: compile(POOL_SKSL),
      drops: compile(DROPS_SKSL),
      letter: compile(LETTER_SKSL),
    },
    textures: bakeWaterTextures(),
    liquid: Skia.ImageFilter.MakeColorFilter(
      Skia.ColorFilter.MakeMatrix(LIQUID_THRESHOLD),
      Skia.ImageFilter.MakeBlur(LIQUID_BLUR * pr, LIQUID_BLUR * pr, TileMode.Decal, null),
      Skia.XYWHRect(0, 0, stage.width * pr, stage.height * pr),
    ),
    red: [colour[0] ?? 0, colour[1] ?? 0, colour[2] ?? 0, colour[3] ?? 1],
    fill: filled(red),
    pen,
    ink: filled(red),
    mask,
    layer: { pool: Skia.Paint(), drops: Skia.Paint(), letter: Skia.Paint(), melt: Skia.Paint() },
    faint,
  };
}
