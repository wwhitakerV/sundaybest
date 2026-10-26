import type { Point } from "../logic/stone-cells";

/** Points joined by straight lines, as an SVG path — closed back to the first if `close`. */
export const polyline = (points: readonly Point[], close = false) =>
  `${points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")}${close ? " Z" : ""}`;
