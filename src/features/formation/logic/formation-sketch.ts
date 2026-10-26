import {
  IDEAL_ACCENTS,
  IDEAL_CONNECTORS,
  IDEAL_DOTS,
  IDEAL_OBJECTS,
  IDEAL_STRANDS,
} from "./formation-ideal";
import { pencilStrokesOf, PENCIL_PASSES } from "./formation-pencil";

type Point = { x: number; y: number };

/**
 * vIdeal 2's drawing: vIdeal's lines, where vIdeal draws them, each laid as
 * points close enough to bend smoothly, each knowing the station it belongs
 * to (the object it lies nearest at rest), so it fades when that station
 * empties. It never moves.
 */

/** How far apart a line's points are laid (points): close enough for it to bend round an object. */
const SPACING = 7;

export type SketchLine = {
  station: number;
  /** Its points, flattened (x, y, x, y…). */
  points: number[];
  width: number;
  opacity: number;
  /** Red, a thread, or pencil. */
  red: boolean;
  /** Where it sits down the board (a share of the width): the first open draws bottom up. */
  restY: number;
};

export type SketchMark = {
  station: number;
  kind: "dot" | "accent";
  at: Point;
  size: number;
  red: boolean;
  lead: boolean;
  seed: number;
  restY: number;
};

/** The station `points` lie nearest at rest: by each object's edge, not its centre. */
function stationOf(points: readonly Point[]): number {
  let best = 0;
  let nearest = Infinity;
  IDEAL_OBJECTS.forEach((object, i) => {
    for (const p of points) {
      const away = Math.hypot(p.x - object.x, p.y - object.y) - object.d / 2;
      if (away < nearest) {
        nearest = away;
        best = i;
      }
    }
  });
  return best;
}

/** `points` along a smooth (Catmull-Rom) curve through them, many to a stretch. */
function densely(points: readonly Point[]): Point[] {
  const p = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))]!;
  const out: Point[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const [a, b, c, d] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    for (let s = 0; s < 16; s += 1) {
      const t = s / 16;
      const t2 = t * t;
      const t3 = t2 * t;
      const at = (pa: number, pb: number, pc: number, pd: number) =>
        0.5 *
        (2 * pb +
          (pc - pa) * t +
          (2 * pa - 5 * pb + 4 * pc - pd) * t2 +
          (3 * pb - pa - 3 * pc + pd) * t3);
      out.push({ x: at(a.x, b.x, c.x, d.x), y: at(a.y, b.y, c.y, d.y) });
    }
  }
  out.push(points.at(-1)!);
  return out;
}

/** A line's points laid evenly along it, `SPACING` apart (along the polyline through `points`). */
function laid(points: readonly Point[]): Point[] {
  const out: Point[] = [points[0]!];
  let carry = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    let along = SPACING - carry;
    while (along < length) {
      out.push({
        x: a.x + ((b.x - a.x) * along) / length,
        y: a.y + ((b.y - a.y) * along) / length,
      });
      along += SPACING;
    }
    carry = length - (along - SPACING);
  }
  out.push(points.at(-1)!);
  return out;
}

/** The whole drawing, on a board `width` points wide. */
export function sketchOf(width: number) {
  const px = (p: Point) => ({ x: p.x * width, y: p.y * width });

  const pencil: SketchLine[] = IDEAL_STRANDS.flatMap((strand, s) => {
    const station = stationOf(strand);
    return pencilStrokesOf(strand.map(px), s + 1).map((stroke, pass) => {
      const points = laid(densely(stroke.points));
      return {
        station,
        points: points.flatMap((p) => [p.x, p.y]),
        width: stroke.width,
        opacity: PENCIL_PASSES[pass]?.opacity ?? stroke.opacity,
        red: false,
        restY: strand[0]!.y,
      };
    });
  });
  // A thread belongs to the station below it: it goes once that station empties.
  const threads: SketchLine[] = IDEAL_CONNECTORS.map((thread, k) => {
    const points = laid(densely(thread.points.map(px)));
    return {
      station: k + 1,
      points: points.flatMap((p) => [p.x, p.y]),
      width: thread.width,
      opacity: 1,
      red: true,
      restY: thread.points[1]?.y ?? thread.points[0]!.y,
    };
  });
  const mark = (at: Point, kind: SketchMark["kind"]) => {
    return { kind, at: px(at), station: stationOf([at]), restY: at.y };
  };
  const marks: SketchMark[] = [
    ...IDEAL_DOTS.map((dot) => ({
      ...mark(dot, "dot"),
      size: dot.r * width,
      red: true,
      lead: false,
      seed: 0,
    })),
    ...IDEAL_ACCENTS.map((accent, i) => ({
      ...mark(accent, "accent"),
      size: (accent.to - accent.x) * width,
      red: accent.tone === "red",
      lead: accent.lead ?? false,
      seed: i + 11,
    })),
  ];
  return { lines: [...pencil, ...threads], marks };
}
