import { RELIEF_LIGHT } from "./formation-relief";
import { smooth } from "./formation-track";

/**
 * How high an object floats, and so how its shadow falls, wherever it is
 * on the track and whatever light it's in (`formation-light`).
 *
 * Height belongs to the place, not the object: the station in hand is the
 * highest, each one down the board a step lower, the last lowest; above the
 * station in hand an object keeps rising a step for each station it climbs,
 * as if lifting off into space.
 */

/** Heights (shares of the board's width): at the station in hand, and at the last, well down on the page. */
const HEIGHT = { top: 0.075, bottom: 0.02 };
/** The last station. */
const LAST = 5;

/**
 * A shadow by height, calibrated to the reference's (fitted as ellipses,
 * each within 0.02 of it), in shares of the object's radius, its height
 * (`h`) in radii too: the cast shadow thrown further, stretched longer
 * along the way it falls, softer and fainter the higher it floats; the
 * contact shadow at its foot small, round and inside its outline, fading
 * away as it rises. Calibrated in the reference's light, at its elevation:
 * a lower light throws it further and draws it out longer, a higher one
 * keeps it closer (`LONGEST`, `SHORTEST` the most either way).
 */
const CAST = {
  reach: 1.5,
  stretch: 0.65,
  size: 0.85,
  blur: 0.12,
  blurPerHeight: 0.18,
  a: 0.52,
  fade: 0.1,
};
const CONTACT = { d: 0.06, size: 0.89, blur: 0.04, blurPerHeight: 0.06, a: 0.3, goneAt: 1.2 };
const LENGTH = { shortest: 0.6, longest: 1.8 };
/** Every shadow, this strong: lightened from the reference's. */
const SHADOW_STRENGTH = 0.85;
/** The elevation the shadows were calibrated in (radians): the reference's. */
const CALIBRATED = Math.asin(RELIEF_LIGHT.z);

/** The light where an object is: the way it falls (degrees, screen axes: 180 straight left, 90 straight down), and how high it stands over the page (radians). */
export type Light = { angle: number; elevation: number };

/** One soft copy of an object's outline: how far it's shifted, its size, its stretch along the way it falls, its blur, its strength. */
export type ShadowPart = { d: number; s: number; e: number; blur: number; a: number };
export type ShadowNow = { angle: number; cast: ShadowPart; contact: ShadowPart };

/** How high an object floats at station `u` (shares of the board's width). */
export function heightAt(u: number): number {
  "worklet";
  const step = (HEIGHT.top - HEIGHT.bottom) / LAST;
  return HEIGHT.top - step * Math.min(LAST, u);
}

/** The shadow of an object `r` (of the board's width) in radius at station `u`, in `light`. In shares of its radius. */
export function shadowAt(u: number, r: number, light: Light): ShadowNow {
  "worklet";
  const h = heightAt(u) / r;
  const long = Math.min(
    LENGTH.longest,
    Math.max(LENGTH.shortest, Math.tan(CALIBRATED) / Math.tan(light.elevation)),
  );
  return {
    angle: light.angle,
    cast: {
      d: CAST.reach * h * long,
      s: CAST.size,
      e: 1 + CAST.stretch * h * long,
      blur: CAST.blur + CAST.blurPerHeight * h,
      a: Math.max(0, CAST.a - CAST.fade * h) * SHADOW_STRENGTH,
    },
    contact: {
      d: CONTACT.d,
      s: CONTACT.size,
      e: 1,
      blur: CONTACT.blur + CONTACT.blurPerHeight * h,
      a: CONTACT.a * (1 - smooth(h / CONTACT.goneAt)) * SHADOW_STRENGTH,
    },
  };
}
