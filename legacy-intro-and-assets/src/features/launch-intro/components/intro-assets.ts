import {
  PaintStyle,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
  type SkPaint,
  type SkPath,
} from "@shopify/react-native-skia";

import { LETTERS, PEN_WIDTH, STROKES } from "../logic/wordmark";

/**
 * The liquid look: blurred, then its edges cut hard by an alpha threshold, so
 * shapes close together melt into one another like water.
 */
const LIQUID_BLUR = 3.5;
const LIQUID_THRESHOLD = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 18, -7];

/** What the intro draws with, made once: the wordmark's paths and the paints. */
export type IntroAssets = {
  letters: SkPath[];
  /** Every pen line, in writing order. */
  strokes: SkPath[];
  /** Which letter each pen line belongs to. */
  strokeLetter: number[];
  /** The ink, filled: the writing, the drips, the pool and its eruption. */
  fill: SkPaint;
  /** The pen: a round-ended line in the red. */
  pen: SkPaint;
  /** A letter's fill coming in under its pen lines; its opacity changes frame to frame. */
  ink: SkPaint;
  /** The layer paint that turns everything drawn into it into liquid. */
  liquid: SkPaint;
  /** Too faint to survive the liquid's threshold: puts the filter to work without showing. */
  faint: SkPaint;
};

function filled(color: string): SkPaint {
  const paint = Skia.Paint();
  paint.setColor(Skia.Color(color));
  paint.setAntiAlias(true);
  return paint;
}

/** A paint so faint the liquid's threshold drops it: it shows nothing. */
function faint(color: string): SkPaint {
  const paint = filled(color);
  paint.setAlphaf(0.05);
  return paint;
}

/** The intro's paths and paints, in its ink colour. */
export function makeIntroAssets(red: string): IntroAssets {
  const pen = filled(red);
  pen.setStyle(PaintStyle.Stroke);
  pen.setStrokeWidth(PEN_WIDTH);
  pen.setStrokeCap(StrokeCap.Round);
  pen.setStrokeJoin(StrokeJoin.Round);

  const liquid = Skia.Paint();
  liquid.setImageFilter(
    Skia.ImageFilter.MakeColorFilter(
      Skia.ColorFilter.MakeMatrix(LIQUID_THRESHOLD),
      Skia.ImageFilter.MakeBlur(LIQUID_BLUR, LIQUID_BLUR, TileMode.Decal, null),
    ),
  );

  const path = (d: string) => Skia.Path.MakeFromSVGString(d) ?? Skia.Path.Make();
  return {
    letters: LETTERS.map(path),
    strokes: STROKES.flatMap((lines) => lines.map(path)),
    strokeLetter: STROKES.flatMap((lines, li) => lines.map(() => li)),
    fill: filled(red),
    pen,
    ink: filled(red),
    liquid,
    faint: faint(red),
  };
}
