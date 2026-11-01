import { Skia } from "@shopify/react-native-skia";

import { seededRandom } from "../logic/formation-pencil";
import { STONE } from "../logic/formation-stone";
import { blobOf, walkOf, type Point } from "../logic/stone-cells";
import { carvingOf, type Carving } from "./stone-carve";
import { AWAY, cutsIn, gougesIn, patchesIn, pocksIn, wedgesIn, type Patch } from "./stone-marks";
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
  cuts: Point[][];
  wedges: Point[][];
  chips: Chip[];
  gouges: Point[][];
  dents: Spot[];
  pocks: Spot[];
  flecks: Point[][];
  patches: Patch[];
  smudges: Point[][];
  /** Which way its weave runs (radians). */
  weave: number;
};

/**
 * Its one crack, a hairline: running in from its edge on the side turned from the
 * light, nearly straight, kept to where it's still inside.
 */
function cracksIn(place: StonePlace, random: () => number): Point[][] {
  const { length, walk } = STONE.crack;
  for (let tries = 0; tries < 60; tries += 1) {
    const edge = place.edgeAt(random());
    if (!edge) break;
    const { at, out } = edge;
    if (out.x * AWAY.x + out.y * AWAY.y < 0.2) continue;
    const heading = Math.atan2(-out.y, -out.x) + (random() - 0.5) * 0.8;
    const long = (between(random, length) * place.box.width) / 2;
    const start = { x: at.x + out.x * 0.02, y: at.y + out.y * 0.02 };
    const centre = {
      x: start.x + (Math.cos(heading) * long) / 2,
      y: start.y + (Math.sin(heading) * long) / 2,
    };
    const line = walkOf(centre, heading, long, walk, random);
    const leaves = line.findIndex((p, i) => i > 2 && !place.inside(p));
    const kept = leaves === -1 ? line : line.slice(0, leaves);
    if (kept.length > walk.joints / 2) return [kept];
  }
  return [];
}

/** Big rubbed smudges of grime, mostly on the side turned from the light, one by its crack. */
function smudgesIn(place: StonePlace, cracks: Point[][], random: () => number): Point[][] {
  const { count, r, lumps } = STONE.smudges;
  const wanted = Math.round(between(random, count));
  const centres: Point[] = [];
  const byCrack = cracks[0]?.[Math.floor((cracks[0].length - 1) / 3)];
  if (byCrack) centres.push(byCrack);
  for (let tries = 0; tries < 200 && centres.length < wanted; tries += 1) {
    const p = place.somewhere(0.05);
    if (p && p.x * AWAY.x + p.y * AWAY.y > (random() - 0.7) * 0.8) centres.push(p);
  }
  return centres.map((p) => blobOf(p, between(random, r), lumps, random));
}

/** Its orange-red flecks: irregular, and the last smeared out along a way of its own. */
function flecksIn(place: StonePlace, random: () => number): Point[][] {
  const { count, r, lumps, smear } = STONE.flecks;
  return spotsIn(place, count, r, 0.08, random).map((p, i) => {
    const blob = blobOf({ x: 0, y: 0 }, p.r, lumps, random);
    const stretch = i === count - 1 ? smear : 1;
    const turn = random() * Math.PI;
    return blob.map((q) => ({
      x: p.x + q.x * stretch * Math.cos(turn) - q.y * Math.sin(turn),
      y: p.y + q.x * stretch * Math.sin(turn) + q.y * Math.cos(turn),
    }));
  });
}

/** Chips off its edge, on the side turned from the light, where a knock would have taken them. */
function chipsIn(place: StonePlace, random: () => number): Chip[] {
  const chips: Chip[] = [];
  const away = AWAY;
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

const UNWORN = {
  facets: [],
  seams: [],
  folds: [],
  creases: [],
  cracks: [],
  cuts: [],
  wedges: [],
  chips: [],
  gouges: [],
  dents: [],
  pocks: [],
  flecks: [],
  patches: [],
  smudges: [],
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
  const { dents } = STONE;
  const weave = random() * Math.PI;
  const cracks = cracksIn(place, random);
  const cuts = cutsIn(place, cracks, random);
  return {
    ...carving,
    outline: wobbledOutline(place, random),
    cracks,
    cuts,
    wedges: wedgesIn([...cracks, ...cuts], random),
    chips: chipsIn(place, random),
    gouges: gougesIn(place, random),
    dents: spotsIn(place, dents.count, dents.r, dents.wide, random),
    pocks: pocksIn(place, weave, random),
    flecks: flecksIn(place, random),
    patches: patchesIn(place, random),
    smudges: smudgesIn(place, cracks, random),
    weave,
  };
}
