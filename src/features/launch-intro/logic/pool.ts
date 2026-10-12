import { clamp01, easeOut } from "./ease";
import { LETTER_VOLUME } from "./settings";
import type { World } from "./world-types";

/**
 * How high the pool stands at `t`, in points: only what has landed in it. Empty
 * until the first drip lands, then each drop's volume as it settles in, and a
 * little for each letter that pours in.
 */
export function levelAt(world: World, t: number): number {
  "worklet";
  let volume = 0;
  for (const d of world.drips) {
    if (t > d.th) volume += d.r ** 3 * easeOut(clamp01((t - d.th) / 220));
  }
  let letters = 0;
  for (const f of world.falls) {
    if (t > f.hit) letters += LETTER_VOLUME * easeOut(clamp01((t - f.hit) / 200));
  }
  return world.perVolume * volume + letters;
}

/**
 * The water's surface at `x`, given its level `base`: every ripple from what has
 * landed, a gentle slosh, and the water heaving up where the letters pour in.
 */
export function surfaceAt(
  world: World,
  height: number,
  x: number,
  t: number,
  base: number,
): number {
  "worklet";
  let wave = 0;
  for (const im of world.impacts) {
    const dt = t - im.t;
    if (dt < 0 || dt > 1600) continue;
    const dist = Math.abs(x - im.x);
    wave -=
      im.amp * Math.exp(-dt / 420) * Math.exp(-dist / im.w) * Math.cos(0.085 * dist - 0.02 * dt);
  }
  const calm = Math.min(1, base / 40);
  wave += calm * (1.6 * Math.sin(x * 0.021 + t * 0.0021) + 1.1 * Math.sin(x * 0.047 - t * 0.0033));
  let heave = 0;
  for (const h of world.heaves) {
    const dt = t - h.t;
    if (dt < 0 || dt > 1400) continue;
    heave +=
      h.A * (1 - Math.exp(-dt / 45)) * Math.exp(-dt / 320) * Math.exp(-(((x - h.x) / h.w) ** 2));
  }
  wave += Math.min(heave, 70);
  return height - base - wave;
}
