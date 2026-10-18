import { clamp01, easeOut } from "../ease";
import { LETTER_VOLUME } from "../settings";
import { pouring, pourIn, pourReached } from "./pour";
import type { WaterWorld } from "./world-types";

/**
 * What the landed drips have brought, in points of pool height: nothing until the
 * first lands, then each drop's volume as it settles in — a whole pool's worth by
 * the time the letters let go.
 */
function dripLevel(world: Pick<WaterWorld, "drips" | "perVolume">, t: number): number {
  "worklet";
  let volume = 0;
  for (const d of world.drips) {
    if (t > d.th) volume += d.r ** 3 * easeOut(clamp01((t - d.th) / 220));
  }
  return world.perVolume * volume;
}

/**
 * How high the pool stands without its letters: poured in at the start, then
 * raised by each drip that lands (as much as WaterVolumeFromDrip says).
 */
export function surfaceLevel(
  world: Pick<WaterWorld, "drips" | "perVolume" | "pour" | "poolH" | "volumeFromDrip">,
  t: number,
): number {
  "worklet";
  return pourIn(world.pour, t) * world.poolH + dripLevel(world, t) * world.volumeFromDrip;
}

/** How high the pool stands at `t`, in points, with a little for each letter that pours in. */
export function levelAt(world: WaterWorld, t: number): number {
  "worklet";
  let letters = 0;
  for (const f of world.falls) {
    if (t > f.hit) letters += LETTER_VOLUME * easeOut(clamp01((t - f.hit) / 200));
  }
  return surfaceLevel(world, t) + letters;
}

/**
 * How far the pool has turned from red to clear water: as the drips bring the
 * water in, clear once what's landed would fill it, as the letters let go.
 */
export function clearAt(world: WaterWorld, t: number): number {
  "worklet";
  return clamp01(dripLevel(world, t) / world.poolH);
}

/**
 * The water's surface at `x`, given its level `base`: every ripple from what has
 * landed, a slosh that never stops, the water heaving where the letters pour
 * in — all only where the poured-in water has reached — and the pour's own shape.
 */
export function surfaceAt(world: WaterWorld, x: number, t: number, base: number): number {
  "worklet";
  const there = pourReached(world.pour, x, t);
  let wave = 0;
  for (const im of world.impacts) {
    const dt = t - im.t;
    if (dt < 0 || dt > 1600) continue;
    const dist = Math.abs(x - im.x);
    wave -=
      im.amp * Math.exp(-dt / 420) * Math.exp(-dist / im.w) * Math.cos(0.085 * dist - 0.02 * dt);
  }
  const calm = Math.min(1, base / 40);
  wave +=
    calm *
    (2.6 * Math.sin(x * 0.021 + t * 0.0021) +
      1.8 * Math.sin(x * 0.047 - t * 0.0033) +
      // A slow swell under the ripples, so the pool never sits still.
      2.2 * Math.sin(x * 0.011 + t * 0.0013 + 1.7));
  let heave = 0;
  for (const h of world.heaves) {
    const dt = t - h.t;
    if (dt < 0 || dt > 1400) continue;
    heave +=
      h.A * (1 - Math.exp(-dt / 45)) * Math.exp(-dt / 320) * Math.exp(-(((x - h.x) / h.w) ** 2));
  }
  wave += Math.min(heave, 70);
  return world.height - base - wave * there - pouring(world.pour, x, t);
}
