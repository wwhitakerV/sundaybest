import { STROKE_LENGTHS, STROKES } from "./wordmark";

export type StrokeTiming = { letter: number; start: number; end: number };

/**
 * When each pen line is drawn. A quarter of the writing time is the pen
 * lifting — twice as long between letters as within one — and the rest is
 * drawing, shared among the lines by their length. Also returns when each
 * letter's last line ends.
 */
export function strokeTimings(writeMs: number): {
  strokes: StrokeTiming[];
  letterEnds: number[];
} {
  let liftUnits = 0;
  STROKES.forEach((lines, li) => {
    liftUnits += lines.length - 1 + (li > 0 ? 2 : 0);
  });
  const unit = (writeMs * 0.25) / liftUnits;
  const draw = writeMs * 0.75;
  const totalLength = STROKE_LENGTHS.reduce((sum, length) => sum + length, 0);

  const strokes: StrokeTiming[] = [];
  const letterEnds: number[] = [];
  let at = 0;
  let index = 0;
  STROKES.forEach((lines, li) => {
    if (li > 0) at += unit * 2;
    lines.forEach((_, si) => {
      if (si > 0) at += unit;
      const duration = (draw * (STROKE_LENGTHS[index] ?? 0)) / totalLength;
      strokes.push({ letter: li, start: at, end: at + duration });
      at += duration;
      index += 1;
    });
    letterEnds.push(at);
  });
  return { strokes, letterEnds };
}
