import type { StepState } from "./getStepState";

/** How much of a step's segment is filled (0–1), and where each later page begins (0–1). */
export type SegmentFill = { fill: number; dots: number[] };

/**
 * A step's segment in a progress line, when the step has several pages: the
 * current step fills up to the page it's on; a finished one is full; one
 * still ahead is empty. A dot marks where each page after the first begins.
 * A one-page step has no dots.
 */
export function getSegmentFill(state: StepState, pages: number, activePage: number): SegmentFill {
  const count = Math.max(1, Math.floor(pages));
  const page = Math.min(Math.max(activePage, 0), count - 1);
  const fill = state === "completed" ? 1 : state === "upcoming" ? 0 : (page + 1) / count;
  const dots = Array.from({ length: count - 1 }, (_, index) => (index + 1) / count);
  return { fill, dots };
}
