import { seededRandom } from "../logic/formation-pencil";
import { ICON_RELIEF, RING_WEAR } from "../logic/formation-sculpted-ball";
import { blobOf, walkOf, type Point } from "../logic/stone-cells";
import type { IconShape } from "./icon-shape";
import { between, type Spot } from "./stone-place";

/**
 * The damage in a ball's ring, in the ball's units (its radius 1): each
 * strip's line (its shallow, rougher patch), and the marks packed along
 * them — tears, chips and specks.
 */
export type RingWear = { strips: Point[][]; tears: Point[][]; chips: Point[][]; specks: Spot[] };

/** How far out the icon reaches at `turn` (radians), in the ball's units. */
function iconEdgeAt(shape: IconShape, turn: number): number {
  let out = 0;
  for (let d = 0; d <= 1; d += 0.01) {
    const x = (Math.cos(turn) * d) / ICON_RELIEF.fit;
    const y = (Math.sin(turn) * d) / ICON_RELIEF.fit;
    if (shape.mass.contains(x, y)) out = d;
  }
  return out;
}

/** In the ring: on the ball, inside its `edge`, and clear of the icon. */
function ringOf(shape: IconShape) {
  const onIcon = (p: Point) => shape.mass.contains(p.x / ICON_RELIEF.fit, p.y / ICON_RELIEF.fit);
  return (p: Point) =>
    Math.hypot(p.x, p.y) < RING_WEAR.edge &&
    [0, 1, 2, 3].every(
      (k) =>
        !onIcon({
          x: p.x + Math.cos((k * Math.PI) / 2) * 0.015,
          y: p.y + Math.sin((k * Math.PI) / 2) * 0.015,
        }),
    );
}

/** One strip's marks, packed along `line`: specks, chips knocked out, and short tears along its way. */
function marksAlong(line: Point[], inRing: (p: Point) => boolean, random: () => number) {
  const { marks, specks, chips, tears } = RING_WEAR;
  const out: Omit<RingWear, "strips"> = { tears: [], chips: [], specks: [] };
  const count = Math.round(between(random, marks.count));
  for (let k = 0; k < count; k += 1) {
    const i = Math.floor(random() * (line.length - 1));
    const a = line[i]!;
    const b = line[i + 1] ?? a;
    const t = random();
    const along = Math.atan2(b.y - a.y, b.x - a.x);
    const off = (random() - 0.5) * marks.spread * 2;
    const at = {
      x: a.x + (b.x - a.x) * t - Math.sin(along) * off,
      y: a.y + (b.y - a.y) * t + Math.cos(along) * off,
    };
    if (!inRing(at)) continue;
    const kind = random();
    if (kind < marks.specks) out.specks.push({ ...at, r: between(random, specks.r) });
    else if (kind < marks.specks + marks.chips)
      out.chips.push(blobOf(at, between(random, chips.r), chips.lumps, random));
    else {
      const tear = walkOf(
        at,
        along + (random() - 0.5),
        between(random, tears.length),
        tears.walk,
        random,
      );
      if (tear.every(inRing)) out.tears.push(tear);
    }
  }
  return out;
}

/**
 * The ring of ball round `shape`, worn: strips of crumbling damage spread
 * evenly right round it, each a little off its even place — some along the
 * icon's foot, the rest out in the ring — running round it, packed with
 * marks. Seeded: the same icon is always worn the same.
 */
export function ringWearOf(shape: IconShape, seed: number): RingWear {
  const random = seededRandom(seed);
  const inRing = ringOf(shape);
  const { strips } = RING_WEAR;
  const count = Math.round(between(random, strips.count));
  const offset = random() * Math.PI * 2;
  const wear: RingWear = { strips: [], tears: [], chips: [], specks: [] };
  for (let k = 0; k < count; k += 1) {
    const turn = offset + ((k + (random() - 0.5) * 2 * strips.jitter) / count) * Math.PI * 2;
    const inner = iconEdgeAt(shape, turn) + 0.07;
    const reach =
      random() < RING_WEAR.atIcon
        ? inner
        : inner + (0.25 + random() * 0.5) * (RING_WEAR.edge - inner);
    const at = { x: Math.cos(turn) * reach, y: Math.sin(turn) * reach };
    const heading = turn + Math.PI / 2 + (random() - 0.5) * 0.6;
    const line = walkOf(at, heading, between(random, strips.length), strips.walk, random).filter(
      inRing,
    );
    if (line.length < 3) continue;
    const marks = marksAlong(line, inRing, random);
    wear.strips.push(line);
    wear.tears.push(...marks.tears);
    wear.chips.push(...marks.chips);
    wear.specks.push(...marks.specks);
  }
  return wear;
}
