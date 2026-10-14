import type { ClockMoments } from "../clock";
import type { Stage } from "../settings";
import type { PoolMovieSettings } from "./pool-movie-settings";
import movie from "./pool-movie.json";

type Beat = { start: number; end: number };

/**
 * The pool intro in water as a movie (`assets/intro/pool-movie.mp4`), made from
 * its prototype by `npm run render:intro`: its size and frame rate, the stage it
 * was drawn on (in the prototype's points), the settings it was made with, where
 * its beats fall, and when its first letter lands. Its last beat, the fade, is
 * filmed as the full screen of water: the app fades it over the page. Written by
 * the render, beside the movie; never by hand.
 */
type PoolMovie = {
  fps: number;
  frames: number;
  width: number;
  height: number;
  stage: Stage;
  durationMs: number;
  settings: PoolMovieSettings;
  beats: Record<"pour" | "write" | "pause" | "fall" | "sink" | "splash" | "hold" | "fade", Beat>;
  moments: { firstHit: number };
};

export const POOL_MOVIE: PoolMovie = movie;

/**
 * The moments the movie's clock acts on: the haptics as the first letter lands
 * and as the pool erupts, the page shown as the water starts to fade, and the
 * intro done once it has.
 */
export function poolMovieMoments(film: {
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
