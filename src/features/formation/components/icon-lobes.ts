import { PathOp, Skia } from "@shopify/react-native-skia";

import { seededRandom } from "../logic/formation-pencil";
import { ICON_RELIEF } from "../logic/formation-sculpted-ball";
import { walkOf } from "../logic/stone-cells";
import type { Fold } from "./icon-folds";
import type { IconShape } from "./icon-shape";
import { between } from "./stone-place";

/** A folded icon's lumpy outline, and the short folds notching in from it between its lobes. */
export type Lobes = { outline: string; notches: Fold[] };

/**
 * `shape`'s outline made lumpy, as a brain's is: a lobe swelling out every
 * so often along it, a short fold notching in from the edge between some
 * of them. Seeded: the same icon is always the same.
 */
export function lobesOf(shape: IconShape, seed: number): Lobes {
  const random = seededRandom(seed);
  const { lobes, branches } = ICON_RELIEF;
  let outline = shape.mass;
  const notches: Fold[] = [];
  const contours = Skia.ContourMeasureIter(shape.mass, true, 1);
  for (let contour = contours.next(); contour; contour = contours.next()) {
    const length = contour.length();
    const count = Math.max(3, Math.round(length / lobes.every));
    for (let k = 0; k < count; k += 1) {
      const [at, along] = contour.getPosTan(((k + random() * 0.3) / count) * length);
      const side = { x: along.y, y: -along.x };
      const out = shape.mass.contains(at.x + side.x * 0.02, at.y + side.y * 0.02)
        ? { x: -side.x, y: -side.y }
        : side;
      const r = between(random, lobes.r);
      const lump = Skia.Path.Circle(
        at.x - out.x * (r - lobes.out),
        at.y - out.y * (r - lobes.out),
        r,
      );
      outline = Skia.Path.MakeFromOp(outline, lump, PathOp.Union) ?? outline;
      // Between some lobes and the next, a fold cuts in from the edge.
      if (random() > lobes.notched) continue;
      const [gap, gapAlong] = contour.getPosTan(((k + 0.5 + random() * 0.2) / count) * length);
      const gapSide = { x: gapAlong.y, y: -gapAlong.x };
      const inward = shape.mass.contains(gap.x + gapSide.x * 0.02, gap.y + gapSide.y * 0.02)
        ? gapSide
        : { x: -gapSide.x, y: -gapSide.y };
      const notch = between(random, lobes.notch);
      const heading = Math.atan2(inward.y, inward.x) + (random() - 0.5) * 0.6;
      const start = { x: gap.x - inward.x * lobes.out, y: gap.y - inward.y * lobes.out };
      const centre = {
        x: start.x + (Math.cos(heading) * notch) / 2,
        y: start.y + (Math.sin(heading) * notch) / 2,
      };
      notches.push({
        points: walkOf(centre, heading, notch, { joints: 5, wander: 0.6, jitter: 0.006 }, random),
        width: branches.width * 0.7,
        depth: branches.depth * lobes.depth,
        core: branches.core,
        coreDepth: branches.coreDepth * lobes.depth,
        lip: false,
      });
    }
  }
  return { outline: outline.toSVGString(), notches };
}
