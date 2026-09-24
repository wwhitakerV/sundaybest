/**
 * A screen's visits, as the native stack reports them: `visible` while any
 * of it can be seen, and a `count` that goes up each time it comes back into
 * view — so what plays on it can start fresh every visit.
 */
export type Visit = { count: number; visible: boolean };

/** The first visit: the screen mounts in view. */
export const FIRST_VISIT: Visit = { count: 0, visible: true };

/**
 * The screen has finished coming back into view (and settled): a new visit,
 * if it had gone. Not as it starts to appear — what plays on it would start
 * mid-transition and compete with it.
 */
export function onAppeared(visit: Visit): Visit {
  return visit.visible ? visit : { count: visit.count + 1, visible: true };
}

/** The screen has gone fully out of view (covered, or left). */
export function onDisappeared(visit: Visit): Visit {
  return visit.visible ? { ...visit, visible: false } : visit;
}
