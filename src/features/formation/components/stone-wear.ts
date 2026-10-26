import { Skia } from "@shopify/react-native-skia";

import { seededRandom } from "../logic/formation-pencil";
import { RELIEF_LIGHT } from "../logic/formation-relief";
import { STONE } from "../logic/formation-stone";
import { blobOf, walkOf, type Point } from "../logic/stone-cells";
import { carvingOf, type Carving } from "./stone-carve";
import {
  between,
  spotsIn,
  stonePlaceOf,
  wobbledOutline,
  type Spot,
  type StonePlace,
} from "./stone-place";

/** A chip knocked off its edge: the gone piece, its broken face sloping up from `outer` to `inner`. */
type Chip = { points: Point[]; outer: Point; inner: Point };

/** A stone's carving, wear and colour marks, placed in its outline (in the outline's own units). */
export type StoneWear = Carving & {
  outline: string;
  cracks: Point[][];
  chips: Chip[];
  pits: Point[][];
  dents: Spot[];
  pocks: Spot[];
  flecks: Spot[];
  blooms: Point[][];
  /** Which way its weave runs (radians). */
  weave: number;
};

/** Cracks wandering across its widest parts — never across a narrow one. */
function cracksIn(place: StonePlace, random: () => number): Point[][] {
  const { count, length, wide, walk } = STONE.cracks;
  const cracks: Point[][] = [];
  for (let n = 0; n < count; n += 1) {
    for (let tries = 0; tries < 40; tries += 1) {
      const from = place.somewhere(wide);
      if (!from) break;
      const heading = (random() - 0.5) * 1.6 + (random() < 0.5 ? 0 : Math.PI);
      const line = walkOf(
        from,
        heading,
        (between(random, length) * place.box.width) / 2,
        walk,
        random,
      );
      if (line.slice(1, -1).every((p) => place.wide(p, wide))) {
        cracks.push(line);
        break;
      }
    }
  }
  return cracks;
}

/** Chips off its edge, on the side turned from the light, where a knock would have taken them. */
function chipsIn(place: StonePlace, random: () => number): Chip[] {
  const chips: Chip[] = [];
  const away = { x: -RELIEF_LIGHT.x, y: -RELIEF_LIGHT.y };
  for (let tries = 0; chips.length < STONE.chips.count && tries < 80; tries += 1) {
    const edge = place.edgeAt(random());
    if (!edge) break;
    const { at, along, out } = edge;
    if (out.x * away.x + out.y * away.y < 0.1) continue;
    const size = between(random, STONE.chips.size);
    const lean = (random() - 0.5) * size * 0.5;
    const outer = { x: at.x + out.x * 0.03, y: at.y + out.y * 0.03 };
    const inner = {
      x: at.x - out.x * size * 0.55 + along.x * lean,
      y: at.y - out.y * size * 0.55 + along.y * lean,
    };
    chips.push({
      points: [
        { x: outer.x - (along.x * size) / 2, y: outer.y - (along.y * size) / 2 },
        { x: outer.x + (along.x * size) / 2, y: outer.y + (along.y * size) / 2 },
        inner,
      ],
      outer,
      inner,
    });
  }
  return chips;
}

/**
 * Pure white patches where it's powdery or worn clean: a third on its high
 * planes (the deepest inside its outline), a third along its ridges, and the
 * rest anywhere, so they never all follow its form.
 */
function bloomsIn(place: StonePlace, carving: Carving, random: () => number): Point[][] {
  const { count, r, lumps } = STONE.bloom;
  const wanted = Math.round(between(random, count));
  const ridges = carving.seams.filter((seam) => seam.ridge);
  const centres = Array.from({ length: wanted }, (_, n) => {
    if (n < Math.ceil(wanted / 3)) return place.somewhere(0.3) ?? place.somewhere(0.15);
    const ridge = ridges[n % Math.max(1, ridges.length)];
    if (n < Math.ceil((wanted * 2) / 3) && ridge) {
      const [p, q] = ridge.ends;
      const t = random();
      return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
    }
    return place.somewhere(0.02);
  });
  return centres
    .filter((p): p is Point => p !== null)
    .map((p) => blobOf(p, between(random, r), lumps, random));
}

const UNWORN = {
  facets: [],
  seams: [],
  folds: [],
  creases: [],
  cracks: [],
  chips: [],
  pits: [],
  dents: [],
  pocks: [],
  flecks: [],
  blooms: [],
  weave: 0,
};

/**
 * How a stone is carved, worn and coloured in `outlineText` (an SVG path in
 * the sculpt's own units), by rule, seeded so an icon always comes out the
 * same and no two icons alike.
 */
export function stoneWearOf(outlineText: string, seed: number): StoneWear {
  const random = seededRandom(seed);
  const shape = Skia.Path.MakeFromSVGString(outlineText);
  if (!shape) return { ...UNWORN, outline: outlineText };
  const place = stonePlaceOf(shape, random);
  const carving = carvingOf(place, random);
  const { pits, dents, pocks, flecks } = STONE;
  return {
    ...carving,
    outline: wobbledOutline(place, random),
    cracks: cracksIn(place, random),
    chips: chipsIn(place, random),
    pits: spotsIn(place, pits.count, pits.r, pits.wide, random).map((p) =>
      blobOf(p, p.r, pits.lumps, random),
    ),
    dents: spotsIn(place, dents.count, dents.r, dents.wide, random),
    pocks: spotsIn(place, pocks.count, pocks.r, 0.01, random),
    flecks: spotsIn(place, flecks.count, flecks.r, 0.08, random),
    blooms: bloomsIn(place, carving, random),
    weave: random() * Math.PI,
  };
}
