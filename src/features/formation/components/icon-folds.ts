import { seededRandom } from "../logic/formation-pencil";
import { ICON_RELIEF } from "../logic/formation-sculpted-ball";
import { walkOf, type Point } from "../logic/stone-cells";
import type { IconShape } from "./icon-shape";
import { between } from "./stone-place";

/**
 * A fold to cut in: its line, how wide and deep, and its narrow core — how
 * wide, and how much deeper — and whether the clay swells up either side.
 */
export type Fold = {
  points: Point[];
  width: number;
  depth: number;
  core: number;
  coreDepth: number;
  lip: boolean;
};

export type IconFolds = { grooves: Fold[]; fine: Fold[] };

/** How long a line is, along it. */
export const lengthOf = (points: readonly Point[]) =>
  points.reduce(
    (sum, p, i) => (i === 0 ? 0 : sum + Math.hypot(p.x - points[i - 1]!.x, p.y - points[i - 1]!.y)),
    0,
  );

/** `line`, wandering a little to either side as it runs, so it reads as modelled, never ruled. */
function wandering(line: readonly Point[], random: () => number): Point[] {
  const waves = [4, 11].map((w) => ({ w, phase: random() * Math.PI * 2 }));
  let along = 0;
  return line.map((p, i) => {
    const before = line[Math.max(0, i - 1)]!;
    const after = line[Math.min(line.length - 1, i + 1)]!;
    const dx = after.x - before.x;
    const dy = after.y - before.y;
    const span = Math.hypot(dx, dy) || 1;
    if (i > 0) along += Math.hypot(p.x - before.x, p.y - before.y);
    const off =
      ICON_RELIEF.grooves.wander *
      waves.reduce((sum, wave) => sum + Math.sin(along * wave.w + wave.phase), 0);
    return { x: p.x - (dy / span) * off, y: p.y + (dx / span) * off };
  });
}

/** Where folds already run: a fine fold keeps `apart` from every point of them. */
type Taken = Point[];

/** Well inside `shape`, and clear of every fold already `taken`. */
function roomAt(shape: IconShape, taken: Taken, p: Point): boolean {
  const { inside, apart } = ICON_RELIEF;
  return (
    [0, 1, 2, 3].every((k) =>
      shape.mass.contains(
        p.x + Math.cos((k * Math.PI) / 2) * inside,
        p.y + Math.sin((k * Math.PI) / 2) * inside,
      ),
    ) && taken.every((q) => Math.hypot(p.x - q.x, p.y - q.y) > apart)
  );
}

/**
 * A fine, winding fold from `start` along `heading`, `length` long — kept
 * only as far as it has room — and marked as `taken`. Its first steps may
 * leave the fold it branches from.
 */
function fineFold(
  shape: IconShape,
  taken: Taken,
  start: Point,
  heading: number,
  length: number,
  random: () => number,
): Fold | null {
  const { branches, apart } = ICON_RELIEF;
  const centre = {
    x: start.x + (Math.cos(heading) * length) / 2,
    y: start.y + (Math.sin(heading) * length) / 2,
  };
  const walk = walkOf(centre, heading, length, branches.walk, random);
  const blocked = walk.findIndex(
    (p) => Math.hypot(p.x - start.x, p.y - start.y) > apart && !roomAt(shape, taken, p),
  );
  const kept = blocked === -1 ? walk : walk.slice(0, blocked);
  if (lengthOf(kept) < length * 0.4) return null;
  taken.push(...kept);
  return {
    points: kept,
    width: branches.width,
    depth: branches.depth,
    core: branches.core,
    coreDepth: branches.coreDepth,
    lip: false,
  };
}

/** Folds branching off each groove, a little way along it, turned well off its way. */
function branchesOf(shape: IconShape, grooves: Fold[], taken: Taken, random: () => number) {
  return grooves.flatMap((groove) => {
    const count = Math.round(lengthOf(groove.points) * ICON_RELIEF.branches.perLength);
    return Array.from({ length: count }, () => {
      const i = Math.floor((0.15 + random() * 0.7) * (groove.points.length - 1));
      const a = groove.points[Math.max(0, i - 1)]!;
      const b = groove.points[Math.min(groove.points.length - 1, i + 1)]!;
      const turn = (0.9 + random() * 0.6) * (random() < 0.5 ? -1 : 1);
      const heading = Math.atan2(b.y - a.y, b.x - a.x) + turn;
      const length = between(random, ICON_RELIEF.branches.length);
      return fineFold(shape, taken, groove.points[i]!, heading, length, random);
    }).filter((fold): fold is Fold => fold !== null);
  });
}

/** Winding folds through its plain parts, each starting where there's room. */
function freeFoldsOf(shape: IconShape, taken: Taken, random: () => number): Fold[] {
  const count = Math.round(shape.area * ICON_RELIEF.free.perArea);
  const folds: Fold[] = [];
  for (let tries = 0; tries < count * 30 && folds.length < count; tries += 1) {
    const p = { x: random() * 2 - 1, y: random() * 2 - 1 };
    if (!roomAt(shape, taken, p)) continue;
    const length = between(random, ICON_RELIEF.free.length);
    const fold = fineFold(shape, taken, p, random() * Math.PI * 2, length, random);
    if (fold) folds.push(fold);
  }
  return folds;
}

/**
 * The folds cut into `shape`: its own lines as grooves, then — if it's
 * `folded`, and not busy, its grooves already filling it — finer folds off
 * them and in its plain parts. Seeded: the same icon is always folded the same.
 */
export function iconFoldsOf(shape: IconShape, folded: boolean, seed: number): IconFolds {
  const random = seededRandom(seed);
  const { grooves: groove, busy } = ICON_RELIEF;
  const crowding = shape.lines.reduce((sum, line) => sum + lengthOf(line), 0) / shape.area;
  const held = Math.min(1, busy / Math.max(crowding, 1e-6));
  const grooves = shape.lines.map((line) => ({
    points: wandering(line, random),
    width: groove.width,
    depth: groove.depth * held,
    core: groove.core,
    coreDepth: groove.coreDepth * held,
    lip: true,
  }));
  if (crowding >= busy || !folded) return { grooves, fine: [] };
  const taken: Taken = grooves.flatMap((g) => g.points);
  const branches = branchesOf(shape, grooves, taken, random);
  return { grooves, fine: [...branches, ...freeFoldsOf(shape, taken, random)] };
}
