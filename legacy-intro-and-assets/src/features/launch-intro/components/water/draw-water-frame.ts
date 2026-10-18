import {
  ClipOp,
  Skia,
  type SkCanvas,
  type SkImageFilter,
  type SkPaint,
} from "@shopify/react-native-skia";

import { wetTop } from "../../logic/water/bounds";
import type { WaterFrame } from "../../logic/water/frame";
import { warmMelt } from "../../logic/water/melt";
import { letterBox, unionBox } from "../../logic/water/pixels";
import type { WaterScene } from "../../logic/water/scene";
import { WORD } from "../../logic/wordmark";
import { tearPath } from "../tear-path";
import { meltFilter } from "./melt-filter";
import type { WaterAssets } from "./water-assets";
import { letterFilter, poolFilter } from "./water-filters";

/** Below and beside the screen: the water's shape closes off out of sight. */
const BLEED = 20;
const BELOW = 60;

/** A paint's filter for this frame. */
function withFilter(paint: SkPaint, filter: SkImageFilter): SkPaint {
  "worklet";
  paint.setImageFilter(filter);
  return paint;
}

/** Draws in points again inside a layer opened in the screen's pixels. Restore when done. */
function inPoints(canvas: SkCanvas, pr: number): void {
  "worklet";
  canvas.save();
  canvas.scale(pr, pr);
}

/**
 * Draws in the wordmark's units, where letter `i` has fallen to, tilted about its
 * own centre, inside a layer opened in the screen's pixels. Restore when done.
 */
function inLetter(canvas: SkCanvas, scene: WaterScene, frame: WaterFrame, i: number, pr: number) {
  "worklet";
  inPoints(canvas, pr);
  const { cx, cy, ws } = scene.world;
  canvas.translate(cx, cy);
  canvas.scale(ws, ws);
  canvas.translate(-WORD.width / 2, -WORD.height / 2);
  const letter = frame.letters[i];
  if (!letter) return;
  canvas.translate(0, letter.dy / ws);
  canvas.rotate(letter.rot, letter.cx, WORD.height / 2);
}

/**
 * Letter `i`'s outline, melted as it has while it fell, so it never snaps back to
 * its shape — or, in the blank beat, part-way melted where nothing shows, so the
 * melt's filter is put to work before the letters let go.
 */
function drawMelted(
  canvas: SkCanvas,
  scene: WaterScene,
  frame: WaterFrame,
  assets: WaterAssets,
  i: number,
): void {
  "worklet";
  const letter = frame.letters[i];
  const path = assets.letters[i];
  const region = assets.regions[i];
  if (!letter || !path || !region) return;
  const melt = frame.warming && i === 0 ? warmMelt(scene.settings.melt) : letter.melt;
  if (melt.melting) canvas.saveLayer(withFilter(assets.layer.melt, meltFilter(melt, i, region)));
  canvas.drawPath(path, assets.fill);
  if (melt.melting) canvas.restore();
}

/** The pool's water: its surface, its loose drops, and the letters pouring into it. */
function drawPool(
  canvas: SkCanvas,
  scene: WaterScene,
  frame: WaterFrame,
  assets: WaterAssets,
  t: number,
  pr: number,
): void {
  "worklet";
  const { width: W, height: H } = scene.stage;
  // Its living body only where there's water this frame. In the blank beat, a dab too
  // faint to show, so the water's filter first runs then.
  const top = wetTop(scene, frame);
  if (top === null && !frame.warming) return;
  const from = Math.min(H - 1, Math.max(0, top ?? H / 2 - 40));
  const wet = Skia.XYWHRect(0, from * pr, W * pr, (H - from) * pr);
  canvas.saveLayer(withFilter(assets.layer.pool, poolFilter(scene, assets, t, pr, wet)));
  inPoints(canvas, pr);
  if (frame.warming) canvas.drawCircle(W / 2, H / 2, 20, assets.faint);
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
  frame.letters.forEach((letter, i) => {
    if (!letter.visible || !letter.liquid) return;
    inLetter(canvas, scene, frame, i, pr);
    drawMelted(canvas, scene, frame, assets, i);
    canvas.restore();
  });
  canvas.restore();
}

/** The drips hanging and falling, and the drain's pops: clear water, as the letters are. */
function drawDrops(
  canvas: SkCanvas,
  frame: WaterFrame,
  assets: WaterAssets,
  drops: SkImageFilter,
  pr: number,
): void {
  "worklet";
  if (!frame.tears.length && !frame.warming) return;
  canvas.saveLayer(withFilter(assets.layer.drops, drops));
  inPoints(canvas, pr);
  if (frame.warming) canvas.drawCircle(0, 0, 20, assets.faint);
  for (const tear of frame.tears) canvas.drawPath(tearPath(tear), assets.fill);
  canvas.restore();
  canvas.restore();
}

/** Where the pen has been on letter `i`: its lines so far, and its fill once they're done. */
function drawPenMask(canvas: SkCanvas, frame: WaterFrame, assets: WaterAssets, i: number): void {
  "worklet";
  assets.strokes.forEach((stroke, k) => {
    const reveal = frame.strokes[k] ?? 0;
    if (assets.strokeLetter[k] !== i || reveal <= 0) return;
    if (reveal >= 1) {
      canvas.drawPath(stroke, assets.pen);
      return;
    }
    const partial = stroke.copy();
    if (partial.trim(0, reveal, false)) canvas.drawPath(partial, assets.pen);
  });
  const ink = frame.inks[i] ?? 0;
  const letter = assets.letters[i];
  if (ink > 0 && letter) {
    assets.ink.setAlphaf(ink);
    canvas.drawPath(letter, assets.ink);
  }
}

/**
 * The letters as water, all in one layer: their living water laid across the
 * whole word, worked out only within the letters' own boxes. While the pen
 * writes, a letter shows only where the pen has been — the whole letter's
 * water, masked by the pen's lines — never the pen's own edge.
 */
function drawLetters(
  canvas: SkCanvas,
  scene: WaterScene,
  frame: WaterFrame,
  assets: WaterAssets,
  t: number,
  pr: number,
): void {
  "worklet";
  const shown: number[] = [];
  const boxes: { x: number; y: number; width: number; height: number }[] = [];
  frame.letters.forEach((letter, i) => {
    const region = assets.regions[i];
    if (!letter.visible || letter.liquid || !region) return;
    // A letter the pen hasn't reached yet has nothing to show; the first warms the filters.
    const started = frame.strokes.some((reveal, k) => reveal > 0 && assets.strokeLetter[k] === i);
    if (frame.writing && !started && !(frame.warming && i === 0)) return;
    shown.push(i);
    boxes.push(letterBox(scene, region, letter.dy, pr));
  });
  const b = unionBox(boxes);
  if (!b) return;
  const box = Skia.XYWHRect(b.x, b.y, b.width, b.height);
  canvas.save();
  canvas.clipRect(box, ClipOp.Intersect, false);
  if (frame.writing) canvas.saveLayer(undefined, box);
  canvas.saveLayer(withFilter(assets.layer.letter, letterFilter(scene, assets, t, pr, box)), box);
  for (const i of shown) {
    inLetter(canvas, scene, frame, i, pr);
    drawMelted(canvas, scene, frame, assets, i);
    canvas.restore();
  }
  canvas.restore();
  if (frame.writing) {
    canvas.saveLayer(assets.mask, box);
    for (const i of shown) {
      inLetter(canvas, scene, frame, i, pr);
      drawPenMask(canvas, frame, assets, i);
      canvas.restore();
    }
    canvas.restore();
    canvas.restore();
  }
  canvas.restore();
}

/**
 * Draws one moment of the water intro: the pool, then the drips, then the
 * letters. Skia works a custom shader filter out at one unit of its layer to a
 * pixel, so each water's layer is opened in the screen's own pixels (`pr` to a
 * point) and what's in it drawn back in points: its glass is as sharp as the screen.
 */
export function drawWaterFrame(
  canvas: SkCanvas,
  scene: WaterScene,
  frame: WaterFrame,
  assets: WaterAssets,
  drops: SkImageFilter,
  t: number,
  pr: number,
): void {
  "worklet";
  canvas.save();
  canvas.scale(1 / pr, 1 / pr);
  drawPool(canvas, scene, frame, assets, t, pr);
  drawDrops(canvas, frame, assets, drops, pr);
  drawLetters(canvas, scene, frame, assets, t, pr);
  canvas.restore();
}
