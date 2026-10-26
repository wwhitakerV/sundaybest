import type { IdealGlyph, IdealObject } from "./formation-ideal";

/**
 * The symbols set into vIdeal's objects: lucide's own drawings
 * (lucide-react-native 1.47.0 — Eye, Brain, Mouth, ShieldCheck), as SVG
 * paths on their 24-unit grid at their 2-unit stroke, so Skia can raise or
 * sink them into a face. lucide doesn't export its path data, so it's
 * copied here; keep it to what the package draws. The red eye's almond is
 * lucide's eye, its outline alone.
 */
const EYE_OUTLINE =
  "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0";
const SHIELD_OUTLINE =
  "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z";

/** The brain's mass, the lobes standing off the ball before its folds are cut in: an oval on the grid. */
const BRAIN_MASS = "M 2.6 12.2 a 9.4 9 0 1 0 18.8 0 a 9.4 9 0 1 0 -18.8 0 z";
const LIPS =
  "M2.457 11.159a1 1 0 00-.307 1.369 11.59 11.59 0 0019.7 0 1 1 0 00-.308-1.368c-2.426-1.568-3.65-2.284-5.479-3.644a2.6 2.6 0 00-3.373.208 1 1 0 01-1.38 0 2.62 2.62 0 00-3.373-.208c-1.83 1.36-3.053 2.076-5.48 3.643";

/**
 * How a symbol is set into a face: a shape raised off it or sunk into it,
 * lines standing up as ridges or cut in as grooves, and a bead at its
 * centre — the raised eye's pupil, the red eye's pearl.
 */
export type GlyphDrawing = {
  raised?: string;
  sunk?: string;
  ridges?: readonly string[];
  grooves?: readonly string[];
  bead?: "pupil" | "pearl";
};

export const GLYPHS: Record<IdealGlyph, GlyphDrawing> = {
  eye: { sunk: EYE_OUTLINE, ridges: [EYE_OUTLINE], bead: "pupil" },
  almond: { sunk: EYE_OUTLINE, bead: "pearl" },
  brain: {
    raised: BRAIN_MASS,
    grooves: [
      "M12 18V5",
      "M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4",
      "M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5",
      "M17.997 5.125a4 4 0 0 1 2.526 5.77",
      "M18 18a4 4 0 0 0 2-7.464",
      "M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517",
      "M6 18a4 4 0 0 1-2-7.464",
      "M6.003 5.125a4 4 0 0 0-2.526 5.77",
    ],
  },
  mouth: { raised: LIPS, grooves: ["M2 12a50.5 50.5 0 0020 0 1 1 0 00-1-1"] },
  shieldCheck: { sunk: SHIELD_OUTLINE, ridges: ["m9 12 2 2 4-4"] },
};

/** Each glyph's width on its object, as a share of the object's radius, and its height to width. */
export const GLYPH_FIT: Record<IdealGlyph, { width: number; stretch: number }> = {
  eye: { width: 1.16, stretch: 1 },
  almond: { width: 0.92, stretch: 1.3 },
  brain: { width: 1.52, stretch: 1 },
  mouth: { width: 0.78, stretch: 1.1 },
  shieldCheck: { width: 0.74, stretch: 1 },
};

/** The lucide grid's own width the glyphs fill (2 to 22 of 24). */
export const GLYPH_SPAN = 20;

/**
 * The mouth's plaque, a shield, traced off its reference on a unit radius,
 * centred: a softly peaked top, straight sides, the lower edges bowing out
 * as they run in to a point, every corner gently rounded.
 */
export const PLAQUE_PATH = [
  "M 0.0316 -0.695",
  "L 0.568 -0.44",
  "Q 0.6 -0.425 0.6 -0.39",
  "L 0.585 0.285",
  "C 0.585 0.45 0.2 0.68 0.032 0.752",
  "Q 0 0.768 -0.032 0.752",
  "C -0.2 0.68 -0.585 0.45 -0.585 0.285",
  "L -0.6 -0.39",
  "Q -0.6 -0.425 -0.568 -0.44",
  "L -0.0316 -0.695",
  "Q 0 -0.71 0.0316 -0.695 Z",
].join(" ");

/**
 * The stone heart, on a unit half-width, centred: full lobes, a shallow
 * notch, its sides easing to a blunt point a little right of centre — a
 * pebble's heart, not a symbol's.
 */
export const HEART_PATH = [
  "M 0.02 -0.66",
  "C 0.18 -0.92 0.62 -0.98 0.86 -0.7",
  "C 1.06 -0.46 1 -0.08 0.78 0.22",
  "C 0.56 0.52 0.28 0.74 0.1 0.88",
  "C 0.04 0.92 -0.02 0.9 -0.08 0.86",
  "C -0.32 0.68 -0.66 0.44 -0.86 0.14",
  "C -1.04 -0.14 -1 -0.54 -0.8 -0.74",
  "C -0.56 -0.96 -0.14 -0.92 0.02 -0.66 Z",
].join(" ");

/**
 * The outline a sculpt is swelled from, on a unit half-width, centred: the
 * icon that gives it its shape. (The heart's, for now; the icon system will
 * draw any icon's silhouette here.)
 */
export function sculptOutlineOf(_object: IdealObject): string {
  return HEART_PATH;
}
