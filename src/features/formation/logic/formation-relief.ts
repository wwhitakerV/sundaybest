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

export type ReliefForm = "dome" | "puck" | "pillow" | "ball" | "heart";

/**
 * Each form's height, 0 at the page to 1 at its top, at a share `t` of its
 * radius out from its centre: a ceramic button's shallow cap, a puck's flat
 * top rounding over at its rim, the shield's pillow, the brain's ball.
 */
function heightAt(form: Exclude<ReliefForm, "heart">, t: number): number {
  switch (form) {
    case "dome": {
      const R = 1.25;
      const foot = Math.sqrt(R * R - 1);
      return (Math.sqrt(Math.max(0, R * R - t * t)) - foot) / (R - foot);
    }
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

/** A form's profile as a radial gradient's stops: where (0–1 of the radius), and how high there. */
export function profileOf(form: Exclude<ReliefForm, "heart">): { at: number[]; height: number[] } {
  const at = Array.from({ length: 13 }, (_, i) => i / 12);
  return { at, height: at.map((t) => heightAt(form, t)) };
}

/** How deep each form stands, at its top (of its radius): what the light's slope is read against. */
export const RELIEF_DEPTH: Record<ReliefForm, number> = {
  dome: 0.85,
  puck: 0.35,
  pillow: 0.8,
  ball: 1,
  heart: 0.9,
};

/**
 * How each finish takes the light: how much reaches the faces turned away
 * (`ambient`, warmed by the page it bounces off: `bounce`), how far the light
 * wraps round (`wrap`), and its sheen — how strong and how tight. Matte
 * ceramic and stone; a soft-touch red with a satin sheen. Set from the
 * reference's faces: a ceramic's shade side is under half its lit side, a
 * red's under a third. And a pale object's rims, read off the eye's edge
 * (`rim`: how far in from its outline they reach, of its radius): where it
 * turns to the light, near white (#FCFBF8 against a #F6F4F2 face); where it
 * turns away, lifted a third and warmed (#AE9982 against a #847159 face).
 * The red ones have none for now. A pale object's lit face shows its own
 * colour true and only its shade goes warm (`neutral`), as the reference's
 * eye does: a near-white #F1EFEB face, a brown #796750 shade.
 */
export const RELIEF_FINISH = {
  ceramic: {
    ambient: 0.5,
    bounce: [1, 0.84, 0.64],
    wrap: 0.25,
    sheen: 0.12,
    tight: 24,
    rim: { reach: 0.05, lit: 0.9, bounce: 0.2, warm: [1, 0.9, 0.75] },
    neutral: 1,
    stain: { reach: 0.06, wideReach: 0.2, strength: 0, wide: 0, polish: 0, tint: [1, 1, 1] },
  },
  red: {
    ambient: 0.32,
    bounce: [1, 0.88, 0.82],
    wrap: 0.2,
    sheen: 0.45,
    tight: 6,
    rim: { reach: 0.05, lit: 0, bounce: 0, warm: [1, 1, 1] },
    neutral: 0,
    stain: { reach: 0.06, wideReach: 0.2, strength: 0, wide: 0, polish: 0, tint: [1, 1, 1] },
  },
  stone: {
    ambient: 0.44,
    bounce: [1, 0.84, 0.64],
    wrap: 0.3,
    sheen: 0.04,
    tight: 8,
    rim: { reach: 0.05, lit: 0.7, bounce: 0.1, warm: [1, 0.9, 0.75] },
    neutral: 1,
    // Dust in its hollows: whatever lies lower than either side of it goes a warm grey-brown, at a
    // fine reach (creases, pits) and a wide one (folds, clefts); its ridges go a touch whiter.
    stain: {
      reach: 0.05,
      wideReach: 0.22,
      strength: 6,
      wide: 3,
      polish: 6,
      tint: [0.7, 0.65, 0.58],
    },
  },
} as const;

/**
 * How high a body's top stands in its map (0–1): the rest is headroom for
 * what's raised from it, so a symbol on its crown is never flattened.
 */
export const BODY_TOP = 0.62;

/** Which profile an object's body has. */
export function reliefFormOf(object: IdealObject): ReliefForm {
  if (object.form === "heart") return "heart";
  if (object.form === "ball") return "ball";
  if (object.form === "dome") return "dome";
  return object.rounded ? "pillow" : "puck";
}
