/**
 * How a multi-step screen's body cross-fades:
 *
 * - `brisk` — a quick UI swap (New Plan, and the Welcome story built on it).
 * - `calm` — for reading: the Daily Study and its Quick Check. The old page
 *   gets out of the way just as fast, but the new one fades up more slowly
 *   and in two beats — its title, then the rest a moment later — so the
 *   words arrive rather than snap in.
 */
export type StepTransitionProfile = "brisk" | "calm";

export type StepTransitionTiming = {
  /** The outgoing body's fade and drop. */
  outMs: number;
  /** The incoming body's fade up. */
  inMs: number;
  /** How far (pt) the incoming body rises into place. */
  rise: number;
  /** How long after its title the rest of the body starts in (0: all at once). */
  staggerMs: number;
  /** Whether the fade still plays with Reduce Motion on (only the rise goes). */
  fadeWithReducedMotion: boolean;
};

const OUT_MS = 110;
const RISE = 8;

/**
 * The timing for a profile. With motion reduced, a calm body still fades —
 * a dissolve isn't motion — but doesn't rise; a brisk one is left to the
 * system, which skips the swap's animation, as it always has.
 */
export function getStepTransitionTiming(
  profile: StepTransitionProfile,
  reduceMotion: boolean,
): StepTransitionTiming {
  if (profile === "brisk") {
    return { outMs: OUT_MS, inMs: 150, rise: RISE, staggerMs: 0, fadeWithReducedMotion: false };
  }
  return {
    outMs: OUT_MS,
    inMs: 240,
    rise: reduceMotion ? 0 : RISE,
    staggerMs: 50,
    fadeWithReducedMotion: true,
  };
}
