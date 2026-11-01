import { Skia, type SkPath } from "@shopify/react-native-skia";

import type { IdealObject } from "../logic/formation-ideal";
import type { FormationIcon } from "../logic/formation-icons";
import { STONE } from "../logic/formation-stone";
import type { Point } from "../logic/stone-cells";
import { iconShapeOf } from "./icon-shape";
import { polyline } from "./stone-paths";

/**
 * A stone sculpt's outline, in its own units, and what's carved into it:
 * an icon that's one solid (a heart) becomes the stone itself; one in
 * pieces (a face in its frame) shapes a stone round all of it, carved with
 * its strokes (`STONE.carve`). Either way scaled so its furthest point is
 * `reach` from its middle — inside its maps' square.
 */
export type SculptOutline = { outline: string; carving: string | null };

const sculpts = new Map<FormationIcon, SculptOutline | null>();

/** How many separate pieces `path` is in. */
function piecesOf(path: SkPath): number {
  const contours = Skia.ContourMeasureIter(path, true, 1);
  let count = 0;
  for (let contour = contours.next(); contour; contour = contours.next()) count += 1;
  return count;
}

/** Points all round `path`'s edges, every `step`. */
function edgePointsOf(path: SkPath, step: number): Point[] {
  const points: Point[] = [];
  const contours = Skia.ContourMeasureIter(path, true, 1);
  for (let contour = contours.next(); contour; contour = contours.next()) {
    for (let d = 0; d < contour.length(); d += step) {
      const [at] = contour.getPosTan(d);
      points.push({ x: at.x, y: at.y });
    }
  }
  return points;
}

/** The convex hull of `points` (Andrew's monotone chain), going round once. */
function hullOf(points: Point[]): Point[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const turn = (o: Point, a: Point, b: Point) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const half = (list: Point[]) => {
    const chain: Point[] = [];
    for (const p of list) {
      while (chain.length >= 2 && turn(chain[chain.length - 2]!, chain[chain.length - 1]!, p) <= 0)
        chain.pop();
      chain.push(p);
    }
    chain.pop();
    return chain;
  };
  return [...half(sorted), ...half([...sorted].reverse())];
}

const scaled = (path: SkPath, by: number) =>
  Skia.PathBuilder.MakeFromPath(path).transform([by, 0, 0, 0, by, 0, 0, 0, 1]).build();

function sculptOf(icon: FormationIcon): SculptOutline | null {
  const shape = iconShapeOf(icon);
  if (!shape) return null;
  const { reach, fit } = STONE.carve;
  const solid = piecesOf(shape.mass) === 1;
  const hull = solid ? null : hullOf(edgePointsOf(shape.mass, 0.02));
  const body = hull ? Skia.Path.MakeFromSVGString(polyline(hull, true)) : shape.mass;
  if (!body) return null;
  const furthest = Math.max(...edgePointsOf(body, 0.02).map((p) => Math.hypot(p.x, p.y)));
  const by = reach / furthest;
  const strokes = Skia.Path.MakeFromSVGString(shape.strokes);
  return {
    outline: scaled(body, by).toSVGString(),
    carving: solid || !strokes ? null : scaled(strokes, by * fit).toSVGString(),
  };
}

/** The sculpt `icon` shapes: worked out once, then kept. */
export function sculptOutlineOf(icon: FormationIcon): SculptOutline | null {
  if (!sculpts.has(icon)) sculpts.set(icon, sculptOf(icon));
  return sculpts.get(icon) ?? null;
}

/** A sculpt's outline, for its shadow; none for an object that's a disc. */
export function sculptShadowOf(object: IdealObject): string | null {
  if (object.form !== "sculpt" || !object.icon) return null;
  return sculptOutlineOf(object.icon)?.outline ?? null;
}
