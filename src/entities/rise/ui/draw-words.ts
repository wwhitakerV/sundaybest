import {
  BlurStyle,
  PaintStyle,
  Skia,
  type SkCanvas,
  type SkFont,
  type SkPaint,
} from "@shopify/react-native-skia";

import type { Balloon, Stage } from "../logic/rise-rules";
import type { Look } from "./draw-balloon";

/**
 * A balloon's words: its answer across its middle, white with a faint dark
 * edge so it reads where it's painted over — and, on a page of what was
 * learned, the time it kept on a smaller line beneath ("+1.5s"), the pair
 * centred together. Worklets, each after what it calls.
 */

/** The answer's face is set for a balloon this wide, and scales with it. */
const WORDS = { forWidth: 140, fit: 0.8, raise: 0.06, edge: 3, edgeOpacity: 0.45 };
/**
 * The line beneath: its size against the answer's, the room between them,
 * and its plus — drawn, as the face has none — and the room after it, as
 * shares of the face's size.
 */
const NOTE = { size: 0.72, under: 0.5, plus: 0.5, bar: 0.12, room: 0.12 };

/** The time beneath, centred at the origin: a drawn plus, when it has one, then its figures. */
function drawNote(canvas: SkCanvas, note: string, font: SkFont, edge: SkPaint, fill: SkPaint) {
  "worklet";
  const plus = note.startsWith("+");
  const figures = plus ? note.slice(1) : note;
  const bounds = font.measureText(figures);
  const size = font.getSize();
  const plusWide = plus ? size * NOTE.plus : 0;
  const room = plus ? size * NOTE.room : 0;
  const left = -(plusWide + room + bounds.width) / 2;
  const baseline = -bounds.y - bounds.height / 2;
  if (plus) {
    const middle = baseline - bounds.height / 2;
    const bar = size * NOTE.bar;
    const across = Skia.XYWHRect(left, middle - bar / 2, plusWide, bar);
    const down = Skia.XYWHRect(left + plusWide / 2 - bar / 2, middle - plusWide / 2, bar, plusWide);
    for (const paint of [edge, fill]) {
      canvas.drawRect(across, paint);
      canvas.drawRect(down, paint);
    }
  }
  const x = left + plusWide + room - bounds.x;
  canvas.drawText(figures, x, baseline, edge, font);
  canvas.drawText(figures, x, baseline, fill, font);
}

/** The answer — and its time beneath, when it has one — across the balloon's middle, shrunk to fit. */
export function drawWords(canvas: SkCanvas, b: Balloon, stage: Stage, look: Look): void {
  "worklet";
  const font = look.font;
  if (!font) return;
  const size = stage.balloonW / WORDS.forWidth;
  const bounds = font.measureText(b.label);
  const fit = Math.min(size, (stage.balloonW * WORDS.fit) / Math.max(1, bounds.width));
  const note = b.note ?? "";
  const below = note ? bounds.height * (NOTE.under + NOTE.size) : 0;
  canvas.save();
  canvas.translate(0, -stage.balloonH * WORDS.raise - (below * fit) / 2);
  canvas.scale(fit, fit);
  const edge = Skia.Paint();
  edge.setAntiAlias(true);
  edge.setStyle(PaintStyle.Stroke);
  edge.setStrokeWidth(WORDS.edge);
  edge.setColor(Skia.Color(look.words));
  edge.setAlphaf(WORDS.edgeOpacity);
  const fill = Skia.Paint();
  fill.setAntiAlias(true);
  fill.setColor(Skia.Color(look.glass));
  if (look.blur > 0) {
    const soft = Skia.MaskFilter.MakeBlur(BlurStyle.Normal, look.blur, true);
    edge.setMaskFilter(soft);
    fill.setMaskFilter(soft);
  }
  const x = -bounds.x - bounds.width / 2;
  const y = -bounds.y - bounds.height / 2;
  canvas.drawText(b.label, x, y, edge, font);
  canvas.drawText(b.label, x, y, fill, font);
  if (note) {
    canvas.save();
    canvas.translate(
      0,
      bounds.height / 2 + bounds.height * NOTE.under + (bounds.height * NOTE.size) / 2,
    );
    canvas.scale(NOTE.size, NOTE.size);
    drawNote(canvas, note, font, edge, fill);
    canvas.restore();
  }
  canvas.restore();
}
