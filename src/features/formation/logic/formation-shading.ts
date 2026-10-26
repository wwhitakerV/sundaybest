import type { IconMetrics, Rgb } from "./formation-icon-metrics";

/** A colour with its opacity, 0–1 each: what Skia draws in. */
export type Rgba = readonly [number, number, number, number];

/**
 * The light, as vLine's reference has it: from the top right, so every
 * icon's shadow falls down and to the left, starting at its edge. A shadow
 * sits a little lift plus a share of the icon's radius away — a small icon's
 * further off for its size than a large one's — and spreads by the same
 * rule. `base` is a share of the board's width; `perRadius` of the icon's
 * own radius.
 */
const LIFT = { base: { dx: -0.01, dy: 0.018 }, perRadius: { dx: -0.34, dy: 0.6 } };
const SPREAD = { base: 0.01, perRadius: 0.5 };
/**
 * A shadow is the icon's own colour, deepened (`depth`, how much of it is
 * kept) — warm under a warm icon, red-brown under a red one, never a cold
 * grey — at this opacity.
 */
const SHADOW = { opacity: 0.42, depth: 0.42 };
/** Its shading, lit from the top right: a highlight there, a shade at the bottom left, by how light it is. */
const SHADE = { highlight: 0.1, highlightDark: 0.14, shade: 0.12, shadeLight: 0.16 };
/**
 * The glow round the stop in hand: its colour, made vivid — only as strong as
 * the icon is vivid (from `from` up to full at `full`), so a red icon glows
 * red and a pale one barely at all, never a grey patch.
 */
const GLOW = { opacity: 0.32, vivid: 0.5, reach: 1.45, from: 0.15, full: 0.45 };
/** The line by an icon: the icon's own colour, lightened toward the page, as the reference's is. */
const LINE = { toPage: 0.22 };

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const clamp = (v: number) => Math.min(1, Math.max(0, v));
/** The page the line is lightened toward: white, the app's own. */
const PAGE: Rgb = [1, 1, 1];

/** A colour pushed further from its own grey: a little more vivid. */
const vivid = (c: Rgb, amount: number): Rgb => {
  const grey = (c[0] + c[1] + c[2]) / 3;
  const push = (v: number) => clamp(grey + (v - grey) * (1 + amount));
  return [push(c[0]), push(c[1]), push(c[2])];
};

/**
 * How vLine draws round one icon, from what the icon is (`IconMetrics`), how
 * big its disc is drawn (`radius`, points), the board's width and the ink
 * (the theme's text colour): its shadow — where, how soft, what colour — its
 * shading, its glow (when it's the stop in hand), and the line's colour by it.
 */
export function shadingOf(icon: IconMetrics, radius: number, boardWidth: number, ink: Rgb) {
  return {
    shadow: {
      dx: LIFT.base.dx * boardWidth + LIFT.perRadius.dx * radius,
      dy: LIFT.base.dy * boardWidth + LIFT.perRadius.dy * radius,
      blur: SPREAD.base * boardWidth + SPREAD.perRadius * radius,
      colour: [
        icon.colour[0] * SHADOW.depth,
        icon.colour[1] * SHADOW.depth,
        icon.colour[2] * SHADOW.depth,
        SHADOW.opacity,
      ] as Rgba,
    },
    highlight: [1, 1, 1, SHADE.highlight + (1 - icon.lum) * SHADE.highlightDark] as Rgba,
    shade: [...ink, SHADE.shade + icon.lum * SHADE.shadeLight] as Rgba,
    glow: {
      colour: [
        ...vivid(icon.colour, GLOW.vivid),
        GLOW.opacity * clamp((icon.sat - GLOW.from) / (GLOW.full - GLOW.from)),
      ] as Rgba,
      reach: GLOW.reach * radius,
    },
    line: [...mix(icon.colour, PAGE, LINE.toPage), 1] as Rgba,
  };
}
