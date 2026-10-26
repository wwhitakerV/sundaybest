import { STATION_LIGHT_ANGLES } from "./formation-ideal";
import { RELIEF_LIGHT } from "./formation-relief";
import { smooth } from "./formation-track";

/**
 * How high an object floats, and so how its shadow falls and how the light
 * meets it, wherever it is on the track.
 *
 * Height belongs to the place, not the object: the station in hand is the
 * highest, each one down the board a step lower, the last lowest; above the
 * station in hand an object keeps rising a step for each station it climbs,
 * as if lifting off into space. The light is a large soft one close by, so it meets each
 * station from a little further round (`STATION_LIGHT_ANGLES`): an object
 * between two takes a blend of their light, and its shadow and its lit side
 * both turn with it.
 */

/** Heights (shares of the board's width): at the station in hand, and at the last, well down on the page. */
const HEIGHT = { top: 0.075, bottom: 0.02 };

/**
 * A shadow by height, calibrated to the reference's (fitted as ellipses,
 * each within 0.02 of it), in shares of the object's radius, its height
 * (`h`) in radii too: the cast shadow thrown further, stretched longer
 * along the way it falls, softer and fainter the higher it floats; the
 * contact shadow at its foot small, round and inside its outline, fading
 * away as it rises.
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
/** Every shadow, this strong: lightened from the reference's. */
const SHADOW_STRENGTH = 0.85;

/** One soft copy of an object's outline: how far it's shifted, its size, its stretch along the way it falls, its blur, its strength. */
export type ShadowPart = { d: number; s: number; e: number; blur: number; a: number };
export type ShadowNow = { angle: number; cast: ShadowPart; contact: ShadowPart };

/** How high an object floats at station `u` (shares of the board's width). */
function heightAt(u: number): number {
  "worklet";
  const last = STATION_LIGHT_ANGLES.length - 1;
  const step = (HEIGHT.top - HEIGHT.bottom) / last;
  const along = Math.min(last, u);
  return HEIGHT.top - step * along;
}

/** The way the light falls at station `u` (degrees): a blend between the stations either side. */
function lightAngleAt(u: number): number {
  "worklet";
  const last = STATION_LIGHT_ANGLES.length - 1;
  const at = Math.min(last, Math.max(0, u));
  const i = Math.min(last - 1, Math.floor(at));
  const t = at - i;
  return STATION_LIGHT_ANGLES[i]! + (STATION_LIGHT_ANGLES[i + 1]! - STATION_LIGHT_ANGLES[i]!) * t;
}

/** Toward the light at station `u`, for the surface shader: its direction turned to that station's, its height kept. */
export function lightAt(u: number): number[] {
  "worklet";
  const toward = ((lightAngleAt(u) - 180) * Math.PI) / 180;
  const flat = Math.hypot(RELIEF_LIGHT.x, RELIEF_LIGHT.y);
  return [Math.cos(toward) * flat, Math.sin(toward) * flat, RELIEF_LIGHT.z];
}

/** The shadow of an object `r` (of the board's width) in radius at station `u`. In shares of its radius. */
export function shadowAt(u: number, r: number): ShadowNow {
  "worklet";
  const h = heightAt(u) / r;
  return {
    angle: lightAngleAt(u),
    cast: {
      d: CAST.reach * h,
      s: CAST.size,
      e: 1 + CAST.stretch * h,
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
