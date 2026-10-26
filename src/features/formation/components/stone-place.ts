import { Skia, type SkPath } from "@shopify/react-native-skia";

import { STONE } from "../logic/formation-stone";
import type { Box, Point } from "../logic/stone-cells";

export type Spot = Point & { r: number };

/** A random number in `[lo, hi]`. */
export const between = (random: () => number, [lo, hi]: readonly number[]) =>
  (lo ?? 0) + random() * ((hi ?? 0) - (lo ?? 0));

/** Where things can go in a stone's outline: the questions every placing rule asks of it. */
export type StonePlace = {
  box: Box;
  /** How much of its outline's box it fills. */
  area: number;
  inside: (p: Point) => boolean;
  /** Inside, and still inside `reach` either way: room for something that size. */
  wide: (p: Point, reach: number) => boolean;
  /** A random point with room `reach` round it, or none if it has nowhere that wide. */
  somewhere: (reach: number) => Point | null;
  /** A point on its outline (at `t` of the way round), the way along it, and its outward side. */
  edgeAt: (t: number) => { at: Point; along: Point; out: Point } | null;
};

/** The placing questions for `shape`, answered with `random`. */
export function stonePlaceOf(shape: SkPath, random: () => number): StonePlace {
  const box = shape.computeTightBounds();
  const inside = (p: Point) => shape.contains(p.x, p.y);
  const wide = (p: Point, reach: number) =>
    inside(p) &&
    inside({ x: p.x + reach, y: p.y }) &&
    inside({ x: p.x - reach, y: p.y }) &&
    inside({ x: p.x, y: p.y + reach }) &&
    inside({ x: p.x, y: p.y - reach });
  const somewhere = (reach: number): Point | null => {
    for (let tries = 0; tries < 300; tries += 1) {
      const p = { x: box.x + random() * box.width, y: box.y + random() * box.height };
      if (wide(p, reach)) return p;
    }
    return null;
  };
  let filled = 0;
  for (let i = 0; i < 20; i += 1)
    for (let j = 0; j < 20; j += 1)
      if (
        inside({
          x: box.x + ((i + 0.5) / 20) * box.width,
          y: box.y + ((j + 0.5) / 20) * box.height,
        })
      )
        filled += 1;
  const measure = Skia.ContourMeasureIter(shape, true, 1).next();
  const edgeAt = (t: number) => {
    if (!measure) return null;
    const [at, along] = measure.getPosTan(t * measure.length());
    const out = inside({ x: at.x + along.y * 0.02, y: at.y - along.x * 0.02 })
      ? { x: -along.y, y: along.x }
      : { x: along.y, y: -along.x };
    return { at, along, out };
  };
  return {
    box: { x: box.x, y: box.y, width: box.width, height: box.height },
    area: ((filled / 400) * box.width * box.height) / 4,
    inside,
    wide,
    somewhere,
    edgeAt,
  };
}

/** `place`'s outline with a slight, smooth wobble along it, so it reads as carved: the same for the same seed. */
export function wobbledOutline(place: StonePlace, random: () => number): string {
  const waves = [3, 7, 13].map((w) => ({ w, phase: random() * Math.PI * 2, a: random() }));
  const total = waves.reduce((sum, wave) => sum + wave.a, 0) || 1;
  const points: string[] = [];
  for (let i = 0; i < STONE.outline.points; i += 1) {
    const t = i / STONE.outline.points;
    const edge = place.edgeAt(t);
    if (!edge) continue;
    const swell =
      (waves.reduce(
        (sum, wave) => sum + wave.a * Math.sin(t * Math.PI * 2 * wave.w + wave.phase),
        0,
      ) /
        total) *
      STONE.outline.wobble;
    points.push(
      `${points.length === 0 ? "M" : "L"} ${edge.at.x + edge.out.x * swell} ${edge.at.y + edge.out.y * swell}`,
    );
  }
  return `${points.join(" ")} Z`;
}

/** `count` random spots with room `reach` round them, each `r` across. */
export function spotsIn(
  place: StonePlace,
  count: number,
  r: readonly number[],
  reach: number,
  random: () => number,
): Spot[] {
  return Array.from({ length: count }, () => place.somewhere(reach))
    .filter((p): p is Point => p !== null)
    .map((p) => ({ ...p, r: between(random, r) }));
}
