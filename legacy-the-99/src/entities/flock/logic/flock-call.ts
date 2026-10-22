import { mix } from "./flock-geometry";
import { BAND, CALL, type FlockGame } from "./flock-rules";

/**
 * The shepherd's call: a touch in the field sends out waves that draw nearby
 * sheep toward it. A tap is a small one; held, it grows over `CALL.growMs` —
 * reaching further, pulling harder, its waves going out faster and faster.
 * Lifted, it ends at once. The wolf never answers it. Worklets, each after
 * what it calls.
 */

/** How strong a call is, `heldMs` into it: a fifth at once, full after `CALL.growMs`. */
function callStrength(heldMs: number): number {
  "worklet";
  return mix(0.2, 1, heldMs / CALL.growMs);
}

/** How far a call of `strength` reaches. */
export function callReach(strength: number): number {
  "worklet";
  return mix(CALL.reach.least, CALL.reach.most, strength);
}

/** How long until the next wave, at `strength`: slower at first, faster as it grows. */
function pulseGap(strength: number): number {
  "worklet";
  return mix(CALL.pulseEvery.slowest, CALL.pulseEvery.fastest, strength);
}

/** Starts a call where the finger lands — in the field only, and only in play. */
export function startCall(game: FlockGame, x: number, y: number): void {
  "worklet";
  if (game.phase !== "play" || y < BAND) return;
  game.call = { active: true, x, y, startedAt: game.time, nextPulseAt: game.time };
}

/** Follows the finger as it moves while calling. */
export function moveCall(game: FlockGame, x: number, y: number): void {
  "worklet";
  if (!game.call.active) return;
  game.call.x = x;
  game.call.y = Math.max(BAND, y);
}

/** Ends the call: the waves stop at once. */
export function endCall(game: FlockGame): void {
  "worklet";
  game.call.active = false;
}

/** The call's strength now, or 0 when there's none. */
export function currentStrength(game: FlockGame): number {
  "worklet";
  return game.call.active ? callStrength(game.time - game.call.startedAt) : 0;
}

/**
 * One tick of the call: a wave goes out when its beat comes round — each
 * one counted (`pulses`) for the screen's haptics — and spent waves go.
 */
export function stepCall(game: FlockGame): void {
  "worklet";
  game.rings = game.rings.filter((ring) => game.time - ring.bornAt < CALL.ringMs);
  if (!game.call.active || game.time < game.call.nextPulseAt) return;
  const strength = currentStrength(game);
  game.rings.push({
    x: game.call.x,
    y: game.call.y,
    bornAt: game.time,
    reach: callReach(strength),
  });
  game.pulses += 1;
  game.call.nextPulseAt = game.time + pulseGap(strength);
}
