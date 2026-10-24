import type { ClockMoments } from "../clock";

/** A screen, or the stage the movie was drawn on, in points. */
export type Stage = { width: number; height: number };

type Beat = { start: number; end: number };

/** Whether the movie holds where it is: the screen is full white and the page isn't ready. */
export function holdsFor(t: number, ready: boolean, holdStart: number): boolean {
  "worklet";
  return !ready && t >= holdStart;
}

/**
 * The moments the movie's clock acts on: the haptics as the first letter lands
 * and as the pool erupts, the page shown as the movie starts to fade, and the
 * intro done once it has.
 */
export function movieMoments(film: {
  beats: { splash: Beat; fade: Beat };
  moments: { firstHit: number };
}): ClockMoments {
  return {
    firstHit: film.moments.firstHit,
    splashStart: film.beats.splash.start,
    revealAt: film.beats.fade.start,
    doneAt: film.beats.fade.end,
  };
}

/** How much of the movie shows at `t`: all of it until the fade, evenly less over it, then none. */
export function fadeOpacity(t: number, fade: Beat): number {
  "worklet";
  if (t <= fade.start) return 1;
  if (t >= fade.end) return 0;
  return 1 - (t - fade.start) / (fade.end - fade.start);
}
