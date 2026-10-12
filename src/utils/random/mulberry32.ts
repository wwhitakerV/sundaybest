/**
 * A small, fast seeded random number generator (Mulberry32): the same seed
 * always gives the same sequence of numbers in [0, 1). For anything that must
 * look random but play out identically every time, like an animation.
 * Predictable by design: never use it for an id, a nonce, or anything secret.
 */
export function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
