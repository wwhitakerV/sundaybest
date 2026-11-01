import type { IdealObject } from "./formation-ideal";

/**
 * How vIdeal's objects are shaped and lit, for the surface shader: each
 * form's profile (its height from its centre to its edge), how deep its
 * relief is, and how each finish takes the one light — read off the
 * reference, whose faces turn from near-white where they meet the light
 * (#F9F7F4 on the eye's upper right) to deep in their own shade (#837057 on
 * its left), so the light is low and to the right.
 */

/** The light: from the right and a little above (azimuth, degrees, screen axes), low over the page (elevation, degrees). */
const LIGHT_AT = { azimuth: -45, elevation: 30 };

/** Toward the light, in the screen's axes (y down, z out of the page): a unit vector. */
export const RELIEF_LIGHT = (() => {
  const az = (LIGHT_AT.azimuth * Math.PI) / 180;
  const el = (LIGHT_AT.elevation * Math.PI) / 180;
  return { x: Math.cos(az) * Math.cos(el), y: Math.sin(az) * Math.cos(el), z: Math.sin(el) };
})();

export type ReliefForm = "dome" | "puck" | "pillow" | "ball" | "sculpt";

/**
 * Each form's height, 0 at the page to 1 at its top, at a share `t` of its
 * radius out from its centre: a ceramic button's shallow cap, a puck's flat
 * top rounding over at its rim, the shield's pillow, the brain's ball.
 */
function heightAt(form: Exclude<ReliefForm, "sculpt">, t: number): number {
  switch (form) {
    case "dome":
      // A paraboloid, not a slice of a sphere: it tilts away from the light steadily all the way out,
      // so its shade deepens gradually across its outer part, never in a band at its outline.
      return 1 - t * t;
    case "puck": {
      // A face very gently domed, so it darkens a touch toward its rim, then rounding over.
      const top = 1 - 0.3 * Math.min(t, 0.84) ** 2;
      if (t < 0.84) return top;
      const k = (t - 0.84) / 0.16;
      return 0.25 + (top - 0.25) * Math.sqrt(Math.max(0, 1 - k * k));
    }
    case "pillow":
      return Math.pow(Math.max(0, 1 - Math.pow(t, 3)), 0.55);
    case "ball":
      return Math.sqrt(Math.max(0, 1 - t * t));
  }
}

/** A form's profile as a radial gradient's stops: where (0–1 of the radius), and how high there — closer together toward its edge, where it falls fastest, so it falls smoothly. */
export function profileOf(form: Exclude<ReliefForm, "sculpt">): { at: number[]; height: number[] } {
  const at = Array.from({ length: 25 }, (_, i) => Math.sin(((i / 24) * Math.PI) / 2));
  return { at, height: at.map((t) => heightAt(form, t)) };
}

/** How deep each form stands, at its top (of its radius): what the light's slope is read against. */
export const RELIEF_DEPTH: Record<ReliefForm, number> = {
  dome: 0.85,
  puck: 0.35,
  pillow: 0.8,
  ball: 1,
  sculpt: 0.9,
};

/**
 * How each finish takes the light: how much reaches the faces turned away
 * (`ambient`, warmed by the page it bounces off: `bounce`), how far the light
 * wraps round (`wrap`), and its sheen — how strong and how tight — and,
 * where its map marks it polished (the mouth's plaque), a satin sheen of
 * its own (`gloss`), on its flat faces too. Matte
 * ceramic and stone; a soft-touch red with a satin sheen. Set from the
 * reference's faces: a ceramic's shade side is under half its lit side, a
 * red's under a third. A pale object's edge is lit by its shape alone, as
 * the reference's eye's is: on its shaded side it's darkest in a soft band
 * a little in from its outline (`core`: where in its map, how wide, how
 * dark), then brightens steadily out to its outline with the warm light the
 * page throws back up onto its underside (`glow`: how strong, over how much
 * of its map's height) — from about 102 to about 150 on the eye. Never a
 * line: it rises across the last fifth of its radius. The red ones have
 * none for now.
 * A pale object's lit face shows its own colour true and only its shade goes
 * warm (`neutral`), as the reference's
 * eye does: a near-white #F1EFEB face, a brown #796750 shade.
 */
export const RELIEF_FINISH = {
  ceramic: {
    ambient: 0.42,
    bounce: [1, 0.8, 0.58],
    wrap: 0.4,
    sheen: 0.12,
    tight: 24,
    gloss: { sheen: 0.9, tight: 11 },
    // Its underside warm as the reference's are, a peach glow rising out to its outline.
    glow: { strength: 0.36, reach: 0.27, warm: [1, 0.84, 0.64] },
    core: { at: 0.24, width: 0.09, dark: 0.04 },
    neutral: 1,
    // Soft warm shade in its wide hollows (the eye's socket, round the plaque's foot, the lips'
    // parting), whichever way the light falls, as the reference's are — never its fine ones, and
    // its ridges never whiter.
    stain: {
      reach: 0.06,
      wideReach: 0.18,
      strength: 0,
      wide: 7,
      polish: 0,
      tint: [0.8, 0.72, 0.62],
    },
  },
  red: {
    ambient: 0.32,
    bounce: [1, 0.88, 0.82],
    wrap: 0.2,
    sheen: 0.45,
    tight: 6,
    gloss: { sheen: 0, tight: 1 },
    glow: { strength: 0, reach: 0.22, warm: [1, 1, 1] },
    core: { at: 0.2, width: 0.08, dark: 0 },
    neutral: 0,
    stain: { reach: 0.06, wideReach: 0.2, strength: 0, wide: 0, polish: 0, tint: [1, 1, 1] },
  },
  // A sculpted ball: the red, with its folds and hollows going near black, as the reference's brain's do.
  sculpted: {
    ambient: 0.32,
    bounce: [1, 0.88, 0.82],
    wrap: 0.2,
    sheen: 0.45,
    tight: 6,
    gloss: { sheen: 0, tight: 1 },
    glow: { strength: 0, reach: 0.22, warm: [1, 1, 1] },
    core: { at: 0.2, width: 0.08, dark: 0 },
    neutral: 0,
    stain: {
      reach: 0.04,
      wideReach: 0.1,
      strength: 9,
      wide: 4,
      polish: 0,
      tint: [0.22, 0.06, 0.05],
    },
  },
  stone: {
    // Its shade lighter than the ceramic's and no warmer, so it sits with them on the board.
    ambient: 0.58,
    bounce: [1, 0.86, 0.7],
    wrap: 0.45,
    // A soft, broad gloss where it turns toward the light, brighter than its own colour, as the reference's right lobe is.
    sheen: 0.16,
    tight: 7,
    gloss: { sheen: 0, tight: 1 },
    glow: { strength: 0.12, reach: 0.22, warm: [1, 0.9, 0.75] },
    core: { at: 0.2, width: 0.08, dark: 0.04 },
    neutral: 1,
    // Dust in its hollows: whatever lies lower than either side of it goes a warm grey-brown, at a
    // fine reach (creases, pits) and a wide one (folds, clefts); its ridges go a touch whiter.
    stain: {
      reach: 0.05,
      wideReach: 0.22,
      strength: 6,
      wide: 3,
      polish: 6,
      tint: [0.78, 0.71, 0.62],
    },
  },
} as const;

/**
 * How high a body's top stands in its map (0–1): the rest is headroom for
 * what's raised from it, so a symbol on its crown is never flattened.
 */
export const BODY_TOP = 0.62;

/** Which finish an object's lit in: its material's, but a sculpted ball's own. */
export function reliefFinishOf(object: IdealObject): keyof typeof RELIEF_FINISH {
  return object.form === "ball" ? "sculpted" : object.finish;
}

/** Which profile an object's body has. */
export function reliefFormOf(object: IdealObject): ReliefForm {
  if (object.form === "sculpt") return "sculpt";
  if (object.form === "ball") return "ball";
  if (object.form === "dome") return "dome";
  return object.rounded ? "pillow" : "puck";
}
