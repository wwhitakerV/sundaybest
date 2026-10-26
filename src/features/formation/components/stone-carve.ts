import { STONE } from "../logic/formation-stone";
import { cellsOf, seamsOf, walkOf, type Point } from "../logic/stone-cells";
import { between, type StonePlace } from "./stone-place";

/** A carved plane: its cell, rising from nothing at `from` to `tip` at `to`. */
type Facet = { cell: Point[]; from: Point; to: Point; tip: number };

/** Where two facets meet: a soft ridge, or a soft valley. */
type Seam = { ends: [Point, Point]; ridge: boolean };

export type Carving = { facets: Facet[]; seams: Seam[]; folds: Point[][]; creases: Point[][] };

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Sites spread evenly through the stone: each the farthest of a few tries from those before it. */
function sitesIn(place: StonePlace, count: number): Point[] {
  const sites: Point[] = [];
  for (let n = 0; n < count; n += 1) {
    let best: Point | null = null;
    let room = -1;
    for (let k = 0; k < 8; k += 1) {
      const p = place.somewhere(0.04);
      if (!p) continue;
      const nearest = Math.min(Infinity, ...sites.map((s) => distance(s, p)));
      if (nearest > room) [best, room] = [p, nearest];
    }
    if (best) sites.push(best);
  }
  return sites;
}

/** Its face cut into tipped planes, and the seams between them that lie on it. */
function facetsOf(place: StonePlace, random: () => number): Pick<Carving, "facets" | "seams"> {
  const { perArea, fewest, most, tip, ridge } = STONE.facets;
  const count = Math.max(fewest, Math.min(most, Math.round(place.area * perArea)));
  const frame = { x: -1.5, y: -1.5, width: 3, height: 3 };
  const cells = cellsOf(sitesIn(place, count), frame);
  const facets = cells.map((cell) => {
    const turn = random() * Math.PI * 2;
    const way = { x: Math.cos(turn), y: Math.sin(turn) };
    const along = cell.map((p) => p.x * way.x + p.y * way.y);
    const [lo, hi] = [Math.min(...along), Math.max(...along)];
    return {
      cell,
      from: { x: way.x * lo, y: way.y * lo },
      to: { x: way.x * hi, y: way.y * hi },
      tip: tip * (0.4 + random() * 0.6),
    };
  });
  const seams = seamsOf(cells, frame)
    .filter(([p, q]) => place.inside({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }))
    .map((ends) => ({ ends, ridge: random() < ridge }));
  return { facets, seams };
}

/**
 * A soft valley in from each inward turn of its outline, deepest turns
 * first: where the chord across a stretch of its outline runs outside it,
 * the outline turns in there, and the further outside, the deeper the turn.
 */
function foldsOf(place: StonePlace): Point[][] {
  const { span, least, length, most } = STONE.folds;
  const samples = 120;
  const turns = Array.from({ length: samples }, (_, i) => {
    const here = place.edgeAt(i / samples);
    const before = place.edgeAt((i / samples - span + 1) % 1);
    const after = place.edgeAt((i / samples + span) % 1);
    if (!here || !before || !after) return 0;
    const chord = { x: (before.at.x + after.at.x) / 2, y: (before.at.y + after.at.y) / 2 };
    return place.inside(chord) ? 0 : distance(chord, here.at);
  });
  // The deepest point of each run of inward turns.
  const deepest = turns
    .map((depth, i) => ({ depth, i }))
    .filter(
      ({ depth, i }) =>
        depth > least &&
        depth >= (turns[(i + samples - 1) % samples] ?? 0) &&
        depth > (turns[(i + 1) % samples] ?? 0),
    )
    .sort((a, b) => b.depth - a.depth)
    .slice(0, most);
  return deepest.flatMap(({ depth, i }) => {
    const edge = place.edgeAt(i / samples);
    if (!edge) return [];
    const reach = Math.min(length[1], Math.max(length[0], depth * 4));
    const end = { x: edge.at.x - edge.out.x * reach, y: edge.at.y - edge.out.y * reach };
    return [[edge.at, end]];
  });
}

/** Short hairlines along its seams (or anywhere, past them), wandering as cracks do. */
function creasesOf(place: StonePlace, seams: Seam[], random: () => number): Point[][] {
  const { count, length, walk } = STONE.creases;
  const wanted = Math.round(between(random, count));
  const creases: Point[][] = [];
  for (let tries = 0; creases.length < wanted && tries < wanted * 6; tries += 1) {
    const seam = seams[Math.floor(random() * seams.length)];
    const t = 0.2 + random() * 0.6;
    const [p, q] = seam?.ends ?? [];
    const centre =
      p && q ? { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t } : place.somewhere(0.06);
    if (!centre) continue;
    const heading = p && q ? Math.atan2(q.y - p.y, q.x - p.x) : random() * Math.PI * 2;
    const line = walkOf(centre, heading, between(random, length), walk, random);
    if (line.every((point) => place.wide(point, 0.03))) creases.push(line);
  }
  return creases;
}

/** How a stone is carved, for any outline: its planes and seams, its folds, its hairline creases. */
export function carvingOf(place: StonePlace, random: () => number): Carving {
  const { facets, seams } = facetsOf(place, random);
  return { facets, seams, folds: foldsOf(place), creases: creasesOf(place, seams, random) };
}
