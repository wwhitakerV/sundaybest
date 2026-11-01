import { STATION_LIGHT_ANGLES } from "./formation-ideal";
import { RELIEF_LIGHT } from "./formation-relief";
import { heightAt, type Light } from "./formation-shadow";

/** The reference's light's elevation (radians): every still station's. */
const REFERENCE_ELEVATION = Math.asin(RELIEF_LIGHT.z);

/**
 * vIdeal 2's lamp: one large soft light standing off the board's upper
 * right, in shares of the board's width (`z` its height over the page). Set
 * at a middle distance: fitted to the reference's shadows on a circle 2.5
 * board-widths round the board's middle, so at rest each object's light is
 * within about 13 degrees of the reference's (the heart's, which no one
 * light fits, about 22), while along the track the light turns some 23 degrees
 * from top to bottom and comes in lower the further an object is from it.
 * Its height puts it at the reference's elevation, on average, at the
 * stations.
 */
const LAMP = { x: 2.63, y: -0.65, z: 1.48 };

/** vIdeal's light at station `u`: the reference's, as read off its shadows, between stations a blend. */
export function stationLight(u: number): Light {
  "worklet";
  const last = STATION_LIGHT_ANGLES.length - 1;
  const at = Math.min(last, Math.max(0, u));
  const i = Math.min(last - 1, Math.floor(at));
  const t = at - i;
  const angle =
    STATION_LIGHT_ANGLES[i]! + (STATION_LIGHT_ANGLES[i + 1]! - STATION_LIGHT_ANGLES[i]!) * t;
  return { angle, elevation: REFERENCE_ELEVATION };
}

/**
 * The lamp's light on an object at (`x`, `y`) on the board (shares of its
 * width), floating at station `u`'s height: the way it falls from the lamp
 * to the object, and how high the lamp stands over it from there.
 */
export function lampLight(x: number, y: number, u: number): Light {
  "worklet";
  const across = x - LAMP.x;
  const down = y - LAMP.y;
  return {
    angle: (Math.atan2(down, across) * 180) / Math.PI,
    elevation: Math.atan2(LAMP.z - heightAt(u), Math.hypot(across, down)),
  };
}

/** Toward `light`, for the surface shader: a unit vector, in the screen's axes (y down, z out of the page). */
export function towardLight(light: Light): number[] {
  "worklet";
  const toward = ((light.angle - 180) * Math.PI) / 180;
  const flat = Math.cos(light.elevation);
  return [Math.cos(toward) * flat, Math.sin(toward) * flat, Math.sin(light.elevation)];
}
