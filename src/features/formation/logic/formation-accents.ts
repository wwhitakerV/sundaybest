import { seededRandom } from "./formation-pencil";

/** A mark of accent art, in points from its start (x) and its middle line (y = 0). */
export type AccentMark =
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number }
  | { kind: "ring"; x: number; y: number; r: number };

/**
 * How the line art that stands where a label stood is built: a dash leading
 * in, when the label had one; a small ring; a run of short ticks of uneven
 * height; and a double rule to its end — meaning nothing, set like type.
 */
const ACCENT = {
  lead: 0.22,
  apart: 3,
  ring: 1.6,
  tick: { every: 2.6, least: 2.2, most: 5.2 },
  ticks: { least: 3, most: 6 },
  rule: 1.4,
};

/** The accent art over `width` points, `seed` setting its ticks: the same every time. */
export function accentMarksOf(width: number, seed: number, lead = false): AccentMark[] {
  const random = seededRandom(seed);
  const marks: AccentMark[] = [];
  let x = 0;
  if (lead) {
    const end = width * ACCENT.lead;
    marks.push({ kind: "line", x1: 0, y1: 0, x2: end, y2: 0 });
    x = end + ACCENT.apart;
  }
  marks.push({ kind: "ring", x: x + ACCENT.ring, y: 0, r: ACCENT.ring });
  x += ACCENT.ring * 2 + ACCENT.apart;
  const { ticks, tick } = ACCENT;
  const count = ticks.least + Math.floor(random() * (ticks.most - ticks.least + 1));
  for (let i = 0; i < count && x < width; i += 1) {
    const half = (tick.least + random() * (tick.most - tick.least)) / 2;
    marks.push({ kind: "line", x1: x, y1: -half, x2: x, y2: half });
    x += tick.every;
  }
  x += ACCENT.apart - tick.every;
  if (x < width) {
    const half = ACCENT.rule / 2;
    marks.push({ kind: "line", x1: x, y1: -half, x2: width, y2: -half });
    marks.push({ kind: "line", x1: x, y1: half, x2: width * 0.82 + x * 0.18, y2: half });
  }
  return marks;
}
