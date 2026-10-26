/** A point, in points on the screen. */
type Point = { x: number; y: number };

/** How long the line's arrowhead arms are (points), and how wide they open (radians either side). */
const ARROW = { arm: 7, open: 0.5 };

/**
 * vLine's pathway, stretch by stretch: one smooth line through `points` (a
 * Catmull-Rom curve, each stretch a cubic Bézier, so it bends evenly through
 * every point), each stretch as an SVG path with its ends — so each can take
 * its own colour, from the icons it runs between.
 */
export function pathwayStretchesOf(points: readonly Point[]) {
  const p = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))]!;
  const stretches: { from: Point; to: Point; d: string }[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const [a, b, c, d] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    const c1 = { x: b.x + (c.x - a.x) / 6, y: b.y + (c.y - a.y) / 6 };
    const c2 = { x: c.x - (d.x - b.x) / 6, y: c.y - (d.y - b.y) / 6 };
    stretches.push({
      from: b,
      to: c,
      d: `M ${b.x} ${b.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${c.x} ${c.y}`,
    });
  }
  return stretches;
}

/** One smooth line through `points` (the same Catmull-Rom curve), whole: an SVG path. */
export function smoothPathOf(points: readonly Point[]): string {
  const first = points[0];
  if (!first) return "";
  const curves = pathwayStretchesOf(points).map((stretch) => stretch.d.replace(/^M [^C]*/, ""));
  return `M ${first.x} ${first.y} ${curves.join(" ")}`;
}

/** A small open arrowhead at the pathway's end, along its last stretch: an SVG path. */
export function arrowheadOf(points: readonly Point[]): string {
  const end = points.at(-1);
  const before = points.at(-2);
  if (!end || !before) return "";
  const angle = Math.atan2(end.y - before.y, end.x - before.x);
  const arm = (turn: number) =>
    `${end.x - Math.cos(angle + turn) * ARROW.arm} ${end.y - Math.sin(angle + turn) * ARROW.arm}`;
  return `M ${arm(ARROW.open)} L ${end.x} ${end.y} L ${arm(-ARROW.open)}`;
}
