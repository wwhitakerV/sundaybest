import { space } from "@/theme";
import { getFloatingNavBarBottom, getFloatingNavBarTintHeight } from "./floatingNavBar";
import { PAGE_TOP } from "./Screen";

/**
 * How far a page's edge fades past what's solid — below a header, above the
 * dock — the same 16pt the tab bar's tint rises above its pill.
 */
export const EDGE_FADE = space[16];

/**
 * How tall a gradual header fade is: thicker than the dock's, kept inside
 * the header's own block so it ends exactly at the header's bottom edge.
 */
export const GRADUAL_FADE = space[32];

/**
 * A gradual fade's ramp, solid to clear down its height: eased, so it melts
 * away rather than reading as a band. `at` runs 0–1 down the ramp.
 */
export const GRADUAL_RAMP = [
  { at: 0, opacity: 1 },
  { at: 0.25, opacity: 0.88 },
  { at: 0.5, opacity: 0.6 },
  { at: 0.75, opacity: 0.25 },
  { at: 1, opacity: 0 },
] as const;

/** How a header meets what scrolls under it: a short fade below it, or a gradual one within it. */
export type HeaderFade = "edge" | "gradual";

/** What sits at a frame's foot: the dock, a verdict panel in its place, or nothing. */
export type FrameFoot = { kind: "none" } | { kind: "dock" } | { kind: "panel"; height: number };

/**
 * One edge of a page: how much of it is solid, how tall its fade is in all
 * (solid included, measured in from the screen's edge), and how far in its
 * content starts so it's clear of both.
 */
export type FrameEdge = { solid: number; height: number; clearance: number };

/**
 * A scrolling page's two edges. The scroll runs the phone's full height;
 * these say what covers each end of it, so what scrolls under a header or the
 * dock dissolves into the page instead of stopping at a line.
 *
 * `headerHeight` is the floating header's whole block, status bar included
 * (0 when there's none, or before it's measured) — with a gradual fade, its
 * fade's room too.
 */
export function getFrameEdges({
  insetTop,
  insetBottom,
  headerHeight,
  headerFade = "edge",
  foot,
}: {
  insetTop: number;
  insetBottom: number;
  headerHeight: number;
  headerFade?: HeaderFade;
  foot: FrameFoot;
}): { top: FrameEdge; bottom: FrameEdge } {
  return {
    top: topEdge(insetTop, headerHeight, headerFade),
    bottom: bottomEdge(insetBottom, foot),
  };
}

function topEdge(insetTop: number, headerHeight: number, headerFade: HeaderFade): FrameEdge {
  if (headerHeight <= 0) {
    return { solid: insetTop, height: insetTop + EDGE_FADE, clearance: insetTop + PAGE_TOP };
  }
  if (headerFade === "gradual") {
    // The ramp is the foot of the header's own block: it ends at its bottom edge.
    return { solid: headerHeight - GRADUAL_FADE, height: headerHeight, clearance: headerHeight };
  }
  const height = headerHeight + EDGE_FADE;
  return { solid: headerHeight, height, clearance: height };
}

function bottomEdge(insetBottom: number, foot: FrameFoot): FrameEdge {
  if (foot.kind === "dock") {
    // Exactly the tab bar's tint, so the two look like one container.
    const capsuleBottom = getFloatingNavBarBottom(insetBottom);
    const height = getFloatingNavBarTintHeight(capsuleBottom);
    return { solid: capsuleBottom, height, clearance: height };
  }
  const solid = foot.kind === "panel" ? foot.height : insetBottom;
  return { solid, height: solid + EDGE_FADE, clearance: solid + EDGE_FADE };
}
