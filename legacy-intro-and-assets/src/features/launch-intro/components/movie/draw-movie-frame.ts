import {
  BlendMode,
  FilterMode,
  MipmapMode,
  Skia,
  TileMode,
  type SkCanvas,
  type SkImage,
  type SkPaint,
} from "@shopify/react-native-skia";

import type { coverFit } from "../../logic/movie/movie";
import { waterFrameAt } from "../../logic/water/frame";
import type { WaterScene } from "../../logic/water/scene";
import { tearPath } from "../tear-path";

/** The liquid look the prototype gives the water's shape: blurred, its edge cut hard. */
const LIQUID_BLUR = 3.5;
const LIQUID_THRESHOLD = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 18, -7];

/** Below and beside the screen: the water's shape closes off out of sight. */
const BLEED = 20;
const BELOW = 60;

/** What the movie is drawn with, made once. */
export type MovieAssets = {
  /** The water's shape, merged like liquid, as the prototype draws it. */
  liquid: SkPaint;
  /** A shape's coverage: only where it's drawn matters. */
  fill: SkPaint;
  /** The movie's frame, kept only where the water's shape is. */
  inside: SkPaint;
};

export function makeMovieAssets(): MovieAssets {
  const liquid = Skia.Paint();
  liquid.setImageFilter(
    Skia.ImageFilter.MakeColorFilter(
      Skia.ColorFilter.MakeMatrix(LIQUID_THRESHOLD),
      Skia.ImageFilter.MakeBlur(LIQUID_BLUR, LIQUID_BLUR, TileMode.Decal, null),
    ),
  );
  const fill = Skia.Paint();
  fill.setAntiAlias(true);
  const inside = Skia.Paint();
  inside.setBlendMode(BlendMode.SrcIn);
  return { liquid, fill, inside };
}

/**
 * The water's shape at `t` as it drains, in the movie's stage points: its falling
 * edge and the drops it sheds, merged as liquid, and the drops that pop up as it
 * leaves the bottom — the same shapes, from the same maths, as the movie's own.
 */
function drawDrainShape(canvas: SkCanvas, scene: WaterScene, assets: MovieAssets, t: number) {
  "worklet";
  const { width: W, height: H } = scene.stage;
  const frame = waterFrameAt(scene, t);
  canvas.saveLayer(assets.liquid);
  const { edge, blobs } = frame;
  if (edge.length >= 2) {
    const water = Skia.Path.Make();
    water.moveTo(-BLEED, H + BELOW);
    water.lineTo(-BLEED, edge[1] ?? H);
    for (let i = 0; i < edge.length; i += 2) water.lineTo(edge[i] ?? 0, edge[i + 1] ?? H);
    water.lineTo(W + BLEED, edge[edge.length - 1] ?? H);
    water.lineTo(W + BLEED, H + BELOW);
    water.close();
    canvas.drawPath(water, assets.fill);
  }
  for (let i = 0; i < blobs.length; i += 4) {
    const x = blobs[i] ?? 0;
    const y1 = blobs[i + 1] ?? 0;
    const y2 = blobs[i + 2] ?? 0;
    const w = blobs[i + 3] ?? 0;
    if (w <= 0 || y2 <= y1) continue;
    const capsule = Skia.RRectXY(Skia.XYWHRect(x - w / 2, y1, w, y2 - y1), w / 2, w / 2);
    canvas.drawRRect(capsule, assets.fill);
  }
  canvas.restore();
  for (const tear of frame.tears) canvas.drawPath(tearPath(tear), assets.fill);
}

/** One frame of a movie, whole, filling the screen (`fit`): it covers everything. */
export function drawWholeFrame(
  canvas: SkCanvas,
  image: SkImage,
  stage: { width: number; height: number },
  fit: ReturnType<typeof coverFit>,
): void {
  "worklet";
  const src = Skia.XYWHRect(0, 0, image.width(), image.height());
  const dst = Skia.XYWHRect(0, 0, stage.width, stage.height);
  canvas.save();
  canvas.translate(fit.dx, fit.dy);
  canvas.scale(fit.scale, fit.scale);
  canvas.drawImageRectOptions(image, src, dst, FilterMode.Linear, MipmapMode.None);
  canvas.restore();
}

/**
 * One frame of the movie, filling the screen (`fit`). Until the water drains it's
 * drawn whole: it covers everything. From the drain on, it's drawn only where the
 * water still is, so the page underneath shows wherever the water has gone.
 */
export function drawMovieFrame(
  canvas: SkCanvas,
  image: SkImage,
  t: number,
  scene: WaterScene,
  fit: ReturnType<typeof coverFit>,
  assets: MovieAssets,
): void {
  "worklet";
  if (t < scene.beats.drain.start) {
    drawWholeFrame(canvas, image, scene.stage, fit);
    return;
  }
  const { width: W, height: H } = scene.stage;
  const src = Skia.XYWHRect(0, 0, image.width(), image.height());
  const dst = Skia.XYWHRect(0, 0, W, H);
  canvas.save();
  canvas.translate(fit.dx, fit.dy);
  canvas.scale(fit.scale, fit.scale);
  canvas.saveLayer();
  drawDrainShape(canvas, scene, assets, t);
  canvas.drawImageRectOptions(image, src, dst, FilterMode.Linear, MipmapMode.None, assets.inside);
  canvas.restore();
  canvas.restore();
}
