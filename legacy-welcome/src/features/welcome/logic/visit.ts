/**
 * A screen's visits, as the native stack reports them: `playing` from the
 * moment it's in view until it starts being left, and a `count` that goes up
 * each time it comes back into view — so what plays on it can start fresh
 * every visit.
 */
export type Visit = { count: number; playing: boolean };

/** The first visit: the screen mounts in view. */
export const FIRST_VISIT: Visit = { count: 0, playing: true };

/**
 * The screen has finished coming back into view (and settled): a new visit,
 * if it had been left. Not as it starts to appear — what plays on it would
 * start mid-transition and compete with it.
 */
export function onAppeared(visit: Visit): Visit {
  return visit.playing ? visit : { count: visit.count + 1, playing: true };
}

/** The screen has started being left (another screen is coming over it). */
export function onLeft(visit: Visit): Visit {
  return visit.playing ? { ...visit, playing: false } : visit;
}
