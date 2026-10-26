/**
 * Where Formation's parts go, in shares of its stage — the reference's own
 * shape, 615 × 1450 — so they fit any version's stops the way the
 * reference's fit its own.
 */
export const ASPECT = 615 / 1450;

/** The stops, top to bottom: eye, brain, mouth, shield, heart — each's height, disc width and callout side. */
export const STOP_Y = [0.19, 0.359, 0.523, 0.645, 0.755] as const;
export const STOP_D = [0.244, 0.244, 0.244, 0.205, 0.235] as const;
export const STOP_SIDE = ["right", "left", "right", "left", "left"] as const;
/** A callout label's width. */
export const LABEL_W = 0.14;

/** A callout's line, from a disc's edge, and its label: as the reference spaces them, kept on the stage. */
const CALLOUT = { clear: 0.018, line: 0.05, labelGap: 0.017, labelText: 0.086, edge: 0.04 };

/** A stop's callout: its line's ends across, and its label's left edge. */
export function calloutOf(x: number, d: number, side: "left" | "right") {
  const { clear, line, labelGap, labelText, edge } = CALLOUT;
  if (side === "right") {
    const from = x + d / 2 + clear;
    const lx = Math.min(1 - edge - LABEL_W, from + line + labelGap);
    return { from, to: Math.max(from, lx - labelGap), lx };
  }
  const to = x - d / 2 - clear;
  const lx = Math.max(edge, to - line - labelText);
  return { from: Math.min(to, lx + labelText), to, lx };
}

type Spot = { x: number; y: number; d: number };

/**
 * The reference's hairlines, placed by the stops: the check's curve down to
 * the first stop, a diagonal from the second toward the third, and a tail
 * from the last — as an SVG path, `at` mapping a stage share to points.
 */
export function hairlinesOf(
  [first, second, third, , last]: readonly Spot[],
  at: (x: number, y: number) => string,
): string {
  if (!first || !second || !third || !last) return "";
  const end = { x: first.x + 0.06, y: first.y - (first.d * ASPECT) / 2 + 0.012 };
  return [
    `M ${at(0.79, 0.1)} Q ${at(end.x + 0.04, 0.1)} ${at(end.x, end.y)}`,
    `M ${at(second.x + 0.134, second.y + 0.036)} L ${at(third.x - 0.051, third.y - 0.063)}`,
    `M ${at(last.x - 0.066, last.y + 0.055)} L ${at(last.x - 0.166, last.y + 0.115)}`,
  ].join(" ");
}
