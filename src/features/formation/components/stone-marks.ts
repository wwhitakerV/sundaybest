import { RELIEF_LIGHT } from "../logic/formation-relief";
import { STONE } from "../logic/formation-stone";
import { blobOf, walkOf, type Point } from "../logic/stone-cells";
import { between, spotsIn, type Spot, type StonePlace } from "./stone-place";

/** The way from the light, across the page: where a knock, a crack or dirt would have landed. */
export const AWAY = { x: -RELIEF_LIGHT.x, y: -RELIEF_LIGHT.y };

/** A patch of tone in the stone: its shape, which tone, how soft its edge, how strong. */
export type Patch = {
  points: Point[];
  tone: "cream" | "putty" | "dusk";
  soft: number;
  strength: number;
};

/** On the side turned from the light, more often than not. */
const shaded = (p: Point, random: () => number) =>
  p.x * AWAY.x + p.y * AWAY.y > (random() - 0.6) * 0.8;

/**
 * Short, near-straight cuts meeting at angles: some setting off from its
 * crack, the rest mostly on the shaded side — each kept where it's inside.
 */
export function cutsIn(place: StonePlace, cracks: Point[][], random: () => number): Point[][] {
  const { count, length, branch, walk } = STONE.cuts;
  const crack = cracks[0];
  const wanted = Math.round(between(random, count));
  const cuts: Point[][] = [];
  for (let tries = 0; cuts.length < wanted && tries < wanted * 10; tries += 1) {
    let start: Point | null;
    let heading = random() * Math.PI * 2;
    if (crack && random() < branch) {
      const i = Math.floor(random() * (crack.length - 1));
      const a = crack[i]!;
      const b = crack[i + 1]!;
      start = a;
      const turn = (0.6 + random() * 0.6) * (random() < 0.5 ? -1 : 1);
      heading = Math.atan2(b.y - a.y, b.x - a.x) + turn;
    } else {
      start = place.somewhere(0.05);
      if (start && !shaded(start, random)) continue;
    }
    if (!start) continue;
    const long = between(random, length);
    const centre = {
      x: start.x + (Math.cos(heading) * long) / 2,
      y: start.y + (Math.sin(heading) * long) / 2,
    };
    const cut = walkOf(centre, heading, long, walk, random);
    if (cut.every((p) => place.wide(p, 0.02))) cuts.push(cut);
  }
  return cuts;
}

/** Tiny dark wedges chipped out along its crack and cuts: small slivers, one way pointed. */
export function wedgesIn(lines: Point[][], random: () => number): Point[][] {
  const { count, size } = STONE.wedges;
  const wanted = Math.round(between(random, count));
  const long = lines.filter((line) => line.length > 1);
  return Array.from({ length: long.length ? wanted : 0 }, () => {
    const line = long[Math.floor(random() * long.length)]!;
    const i = Math.floor(random() * (line.length - 1));
    const a = line[i]!;
    const b = line[i + 1]!;
    const span = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const along = { x: (b.x - a.x) / span, y: (b.y - a.y) / span };
    const side = random() < 0.5 ? 1 : -1;
    const normal = { x: -along.y * side, y: along.x * side };
    const s = between(random, size);
    return [
      { x: a.x + along.x * s, y: a.y + along.y * s },
      {
        x: a.x - along.x * s * 0.3 + normal.x * s * 0.5,
        y: a.y - along.y * s * 0.3 + normal.y * s * 0.5,
      },
      {
        x: a.x - along.x * s * 0.3 - normal.x * s * 0.1,
        y: a.y - along.y * s * 0.3 - normal.y * s * 0.1,
      },
    ];
  });
}

/** A small gouge somewhere with room for it: a short, lumpy oval, turned any way. */
export function gougesIn(place: StonePlace, random: () => number): Point[][] {
  const { length, width, lumps, wide } = STONE.gouge;
  const at = place.somewhere(wide);
  if (!at) return [];
  const long = between(random, length) / 2;
  const turn = random() * Math.PI;
  return [
    blobOf({ x: 0, y: 0 }, 1, lumps, random).map((p) => ({
      x: at.x + p.x * long * Math.cos(turn) - p.y * (width / 2) * Math.sin(turn),
      y: at.y + p.x * long * Math.sin(turn) + p.y * (width / 2) * Math.cos(turn),
    })),
  ];
}

/** Broad, irregular patches of tone — cream, putty, dusk — some soft-edged, some crisp. */
export function patchesIn(place: StonePlace, random: () => number): Patch[] {
  const { count, r, lumps, soft, strength, cream, putty } = STONE.patches;
  const wanted = Math.round(between(random, count));
  return Array.from({ length: wanted }, () => place.somewhere(0.02))
    .filter((p): p is Point => p !== null)
    .map((p) => {
      const pick = random();
      const tone = pick < cream ? "cream" : pick < cream + putty ? "putty" : "dusk";
      return {
        points: blobOf(p, between(random, r), lumps, random),
        tone,
        soft: between(random, soft),
        strength: between(random, strength),
      };
    });
}

/** Tiny dark specks, each settled between two of the weave's rows (at `weave`, radians), anywhere along them. */
export function pocksIn(place: StonePlace, weave: number, random: () => number): Spot[] {
  const { every } = STONE.weave;
  const pit = (v: number) => (Math.round(v / every - 0.5) + 0.5) * every;
  const [cos, sin] = [Math.cos(weave), Math.sin(weave)];
  return spotsIn(place, STONE.pocks.count, STONE.pocks.r, 0.01, random).map((p) => {
    const u = p.x * cos + p.y * sin;
    const v = pit(-p.x * sin + p.y * cos);
    return { x: u * cos - v * sin, y: u * sin + v * cos, r: p.r };
  });
}
