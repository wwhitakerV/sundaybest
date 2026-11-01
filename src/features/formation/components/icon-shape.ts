import { PathOp, Skia, StrokeCap, StrokeJoin, type SkPath } from "@shopify/react-native-skia";

import { FORMATION_ICONS, type FormationIcon } from "../logic/formation-icons";
import { ICON_RELIEF } from "../logic/formation-sculpted-ball";
import type { Point } from "../logic/stone-cells";

/** lucide's stroke, on its grid. */
const STROKE = 2;
/** How finely a stroke is walked to find which of it lies inside (grid units). */
const STEP = 0.25;
/** The shortest run of a stroke that's kept as a groove (in the icon's half-widths). */
const SHORTEST = 0.12;

/**
 * An icon as a shape to model, in its own units — centred, its half-width
 * 1 — whatever the icon: its silhouette (`mass`, its strokes merged and
 * their holes filled), the parts of its strokes that lie well inside it
 * (`lines`), the folds to cut in, and all its strokes as drawn (`strokes`,
 * their centre lines, as one path). Its outline strokes are its edge.
 */
export type IconShape = {
  mass: SkPath;
  outline: string;
  lines: Point[][];
  strokes: string;
  area: number;
};

const shapes = new Map<FormationIcon, IconShape | null>();

/** `path` filled with every hole in it filled: each of its contours taken as its own solid, merged. */
function filled(path: SkPath): SkPath {
  const contours = Skia.ContourMeasureIter(path, false, 1);
  let solid = Skia.Path.Make();
  for (let contour = contours.next(); contour; contour = contours.next()) {
    const part = contour.getSegment(0, contour.length(), true);
    solid = Skia.Path.MakeFromOp(solid, part, PathOp.Union) ?? solid;
  }
  return solid;
}

/**
 * The parts of `stroke` well inside `mass` — each run of them a line — in
 * grid units. A dot (a stroke with next to no length: a calendar's days) is
 * a run of one point, twice: a dimple.
 */
function insideRuns(stroke: SkPath, mass: SkPath, reach: number): Point[][] {
  const deep = (p: Point) =>
    Array.from({ length: 8 }, (_, k) => (k * Math.PI) / 4).every((turn) =>
      mass.contains(p.x + Math.cos(turn) * reach, p.y + Math.sin(turn) * reach),
    );
  const runs: Point[][] = [];
  const contours = Skia.ContourMeasureIter(stroke, false, 1);
  for (let contour = contours.next(); contour; contour = contours.next()) {
    if (contour.length() < STEP * 2) {
      const [at] = contour.getPosTan(0);
      if (deep(at)) runs.push([at, at].map((p) => ({ x: p.x, y: p.y })));
      continue;
    }
    let run: Point[] = [];
    for (let d = 0; d <= contour.length(); d += STEP) {
      const [at] = contour.getPosTan(d);
      if (deep(at)) run.push({ x: at.x, y: at.y });
      else if (run.length > 0) {
        runs.push(run);
        run = [];
      }
    }
    if (run.length > 0) runs.push(run);
  }
  return runs;
}

/** How much of its box `mass` fills, and where its middle of mass is. */
function measureOf(mass: SkPath) {
  const box = mass.computeTightBounds();
  let filledIn = 0;
  let x = 0;
  let y = 0;
  for (let i = 0; i < 40; i += 1)
    for (let j = 0; j < 40; j += 1) {
      const px = box.x + ((i + 0.5) / 40) * box.width;
      const py = box.y + ((j + 0.5) / 40) * box.height;
      if (!mass.contains(px, py)) continue;
      filledIn += 1;
      x += px;
      y += py;
    }
  const share = filledIn / 1600;
  return { box, share, middle: filledIn ? { x: x / filledIn, y: y / filledIn } : null };
}

function shapeOf(icon: FormationIcon): IconShape | null {
  const strokes = FORMATION_ICONS[icon]
    .map((d) => Skia.Path.MakeFromSVGString(d))
    .filter((p): p is SkPath => p !== null);
  let merged = Skia.Path.Make();
  for (const stroke of strokes) {
    const thick = Skia.Path.Stroke(stroke, {
      width: STROKE,
      cap: StrokeCap.Round,
      join: StrokeJoin.Round,
    });
    if (thick) merged = Skia.Path.MakeFromOp(merged, thick, PathOp.Union) ?? merged;
  }
  const grid = filled(merged);
  const { box, share, middle } = measureOf(grid);
  if (!middle || box.width === 0) return null;
  // Centred halfway between its box's middle and its mass's, so a lopsided icon still sits balanced.
  const cx = (box.x + box.width / 2 + middle.x) / 2;
  const cy = (box.y + box.height / 2 + middle.y) / 2;
  const half = Math.max(box.width, box.height) / 2;
  const unit = (p: Point): Point => ({ x: (p.x - cx) / half, y: (p.y - cy) / half });
  const toUnit = [1 / half, 0, -cx / half, 0, 1 / half, -cy / half, 0, 0, 1];
  const mass = Skia.PathBuilder.MakeFromPath(grid).transform(toUnit).build();
  const drawn = strokes
    .map((stroke) => Skia.PathBuilder.MakeFromPath(stroke).transform(toUnit).build().toSVGString())
    .join(" ");
  const lines = strokes
    .flatMap((stroke) => insideRuns(stroke, grid, ICON_RELIEF.inner * half))
    .map((run) => run.map(unit))
    .filter((run) => run.length === 2 || run.length * (STEP / half) >= SHORTEST);
  const area = (share * box.width * box.height) / (half * half);
  return { mass, outline: mass.toSVGString(), lines, strokes: drawn, area };
}

/** `icon` as a shape to model: worked out once, then kept. */
export function iconShapeOf(icon: FormationIcon): IconShape | null {
  if (!shapes.has(icon)) shapes.set(icon, shapeOf(icon));
  return shapes.get(icon) ?? null;
}
