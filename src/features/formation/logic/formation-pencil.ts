import { smoothPathOf } from "./formation-line";

type Point = { x: number; y: number };

/** One pass of the pencil: an SVG path, its weight (points) and how dark it's laid down. */
export type PencilPass = { d: string; width: number; opacity: number };

/**
 * How a pencil line is drawn: a first pass through every point, a little
 * unsteady (`wobble`, points); then a second, lighter and finer, back over
 * part of it — where the hand went over it again — so it reads as drawn,
 * never ruled.
 */
const PENCIL = {
  wobble: 0.45,
  first: { width: 0.6, opacity: 0.5 },
  again: { width: 0.45, opacity: 0.3, from: 0.1, to: 0.65, drift: 0.5 },
};

/** Each pass's weight and darkness, first then again: for lines drawn live. */
export const PENCIL_PASSES = [PENCIL.first, PENCIL.again] as const;

/**
 * A small, fixed random sequence from `seed` (mulberry32): the same strokes
 * on every render and every phone, never a fresh scribble.
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `points`, each moved up to `by` either way — its ends kept where they are. */
function wobbled(points: readonly Point[], by: number, random: () => number): Point[] {
  return points.map((p, i) =>
    i === 0 || i === points.length - 1
      ? p
      : { x: p.x + (random() * 2 - 1) * by, y: p.y + (random() * 2 - 1) * by },
  );
}

/** One pass of the pencil as its points (on the screen), its weight and how dark: for a line drawn live. */
export type PencilStroke = { points: Point[]; width: number; opacity: number };

/** A pencil line through `points` (on the screen): its passes as points, first to last. */
export function pencilStrokesOf(points: readonly Point[], seed: number): PencilStroke[] {
  if (points.length < 2) return [];
  const random = seededRandom(seed);
  const first = wobbled(points, PENCIL.wobble, random);
  const { again } = PENCIL;
  const from = Math.floor((points.length - 1) * again.from);
  const to = Math.max(from + 2, Math.ceil((points.length - 1) * again.to) + 1);
  const part = wobbled(points.slice(from, to), PENCIL.wobble + again.drift, random);
  return [
    { points: first, ...PENCIL.first },
    ...(part.length >= 2 ? [{ points: part, width: again.width, opacity: again.opacity }] : []),
  ];
}

/** A pencil line through `points` (on the screen): its passes as SVG paths, first to last. */
export function pencilPassesOf(points: readonly Point[], seed: number): PencilPass[] {
  return pencilStrokesOf(points, seed).map((stroke) => ({
    d: smoothPathOf(stroke.points),
    width: stroke.width,
    opacity: stroke.opacity,
  }));
}
