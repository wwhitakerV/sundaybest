import {
  BlendMode,
  ColorChannel,
  Skia,
  TileMode,
  type SkImageFilter,
  type SkRect,
} from "@shopify/react-native-skia";

import type { Melt } from "../../logic/water/melt";

// The melt runs on the UI thread, so everything it calls is a worklet: a plain
// function called there throws, and the intro steps aside to the page.

/** Turns alpha up by `k`, leaving colour as it is. */
function alphaTimes(k: number): number[] {
  "worklet";
  return [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, k, 0];
}

/** Opaque wherever red is above `cut / 7`: the streak pattern, cut into gaps. */
function gapsAt(cut: number): number[] {
  "worklet";
  return [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 7, 0, 0, 0, -cut];
}

/** Rounded off along the streams: soft alpha cut hard again. */
const ROUND_OFF = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 16, -6];

/**
 * Letter `li` melting as it falls, as water does under gravity: wobbling, drawn
 * out downward into one continuous smear that thins as it trails, thinning
 * sideways, and breaking along its streams into oblong drops — mixed in from the
 * letter as it was to the streams as it lands. Nothing swells. In the letter's
 * own units, worked out only within its `region` (its noise has no edges of its
 * own); a port of the prototype's melt filter.
 */
export function meltFilter(melt: Melt, li: number, region: SkRect): SkImageFilter {
  "worklet";
  const IF = Skia.ImageFilter;
  const matrix = (values: number[], input: SkImageFilter) =>
    IF.MakeColorFilter(Skia.ColorFilter.MakeMatrix(values), input);
  const noise = IF.MakeOffset(
    melt.driftX,
    melt.driftY,
    IF.MakeShader(Skia.Shader.MakeFractalNoise(0.55, 0.55, 2, li * 7 + 3, 0, 0), false, region),
  );
  const bent = IF.MakeDisplacementMap(ColorChannel.R, ColorChannel.G, melt.bend, noise, null);
  const trail = melt.stretch / 2;
  const trailing = IF.MakeOffset(0, trail, IF.MakeBlur(0, trail, TileMode.Decal, bent));
  const drawnOut = matrix(alphaTimes(2.6), IF.MakeMerge([bent, trailing]));
  const thinned = IF.MakeErode(melt.thin, 0, drawnOut);
  const streaks = IF.MakeOffset(
    0,
    melt.slide,
    IF.MakeShader(Skia.Shader.MakeFractalNoise(0.85, 0.32, 2, li * 11 + 5, 0, 0), false, region),
  );
  const broken = IF.MakeBlend(BlendMode.SrcIn, matrix(gapsAt(melt.cut), streaks), thinned);
  const streams = matrix(ROUND_OFF, IF.MakeBlur(0.03, melt.soft, TileMode.Decal, broken));
  return IF.MakeArithmetic(0, 1 - melt.shaped, melt.shaped, 0, true, streams, bent);
}
