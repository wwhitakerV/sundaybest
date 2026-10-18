import { ClipOp, Skia, type SkCanvas } from "@shopify/react-native-skia";

import type { Frame } from "../logic/frame-types";
import type { Scene } from "../logic/scene";
import { WORD } from "../logic/wordmark";
import type { IntroAssets } from "./intro-assets";
import { tearPath } from "./tear-path";

/** Below and beside the screen: the water's shape closes off out of sight. */
const BLEED = 20;
const BELOW = 60;

/** Moves the canvas into the wordmark's own units, where it's written. */
function intoWord(canvas: SkCanvas, scene: Scene): void {
  "worklet";
  const { cx, cy, ws } = scene.world;
  canvas.translate(cx, cy);
  canvas.scale(ws, ws);
  canvas.translate(-WORD.width / 2, -WORD.height / 2);
}

/** A letter where it has fallen to, tilted about its own centre. */
function placeLetter(canvas: SkCanvas, scene: Scene, frame: Frame, i: number): void {
  "worklet";
  const letter = frame.letters[i];
  if (!letter) return;
  canvas.translate(0, letter.dy / scene.world.ws);
  canvas.rotate(letter.rot, letter.cx, WORD.height / 2);
}

/** The water, the loose drops and the letters pouring in, all as one liquid. */
function drawLiquid(canvas: SkCanvas, scene: Scene, frame: Frame, assets: IntroAssets): void {
  "worklet";
  const { width: W, height: H } = scene.stage;
  canvas.saveLayer(assets.liquid);
  const { edge, blobs } = frame;
  // In the blank beat, a dab too faint to show, so the filter's first run happens now.
  if (frame.warming) canvas.drawCircle(W / 2, H / 2, 20, assets.faint);
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
    const top = blobs[i + 1] ?? 0;
    const bottom = blobs[i + 2] ?? 0;
    const w = blobs[i + 3] ?? 0;
    if (w <= 0 || bottom <= top) continue;
    canvas.drawRRect(
      Skia.RRectXY(Skia.XYWHRect(x - w / 2, top, w, bottom - top), w / 2, w / 2),
      assets.fill,
    );
  }
  frame.letters.forEach((letter, i) => {
    const path = assets.letters[i];
    if (!letter.visible || !letter.liquid || !path) return;
    canvas.save();
    intoWord(canvas, scene);
    placeLetter(canvas, scene, frame, i);
    canvas.drawPath(path, assets.fill);
    canvas.restore();
  });
  canvas.restore();
}

/**
 * One letter while it's written: its pen lines, clipped to the letter's outline,
 * so the letter shows only where the pen has been — never the pen's round line
 * beyond it — and its fill coming in once its lines are done.
 */
function drawWritten(canvas: SkCanvas, frame: Frame, assets: IntroAssets, i: number): void {
  "worklet";
  const letter = assets.letters[i];
  if (!letter) return;
  canvas.save();
  canvas.clipPath(letter, ClipOp.Intersect, true);
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
  if (ink > 0) {
    assets.ink.setAlphaf(ink);
    canvas.drawPath(letter, assets.ink);
  }
  canvas.restore();
}

/** The crisp letters: being written, or whole and falling, until they reach the water. */
function drawLetters(canvas: SkCanvas, scene: Scene, frame: Frame, assets: IntroAssets): void {
  "worklet";
  frame.letters.forEach((letter, i) => {
    const path = assets.letters[i];
    if (!letter.visible || letter.liquid || !path) return;
    canvas.save();
    intoWord(canvas, scene);
    placeLetter(canvas, scene, frame, i);
    if (frame.writing) drawWritten(canvas, frame, assets, i);
    else canvas.drawPath(path, assets.fill);
    canvas.restore();
  });
}

/** Draws one moment of the intro: the liquid, then the crisp drops, then the crisp letters. */
export function drawFrame(canvas: SkCanvas, scene: Scene, frame: Frame, assets: IntroAssets): void {
  "worklet";
  drawLiquid(canvas, scene, frame, assets);
  for (const tear of frame.tears) canvas.drawPath(tearPath(tear), assets.fill);
  drawLetters(canvas, scene, frame, assets);
}
