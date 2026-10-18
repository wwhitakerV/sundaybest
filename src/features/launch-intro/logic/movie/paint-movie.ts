import type { Stage } from "./movie";
import type { PaintMovieSettings } from "./paint-movie-settings";
import movie from "./paint-movie.json";

type Beat = { start: number; end: number };

/**
 * The paint intro as a movie (`assets/intro/paint-movie.mp4`), made from its
 * prototype by `npm run render:intro`: its size and frame rate, the stage it
 * was drawn on (in the prototype's points), the settings it was made with, where
 * its beats fall, and when its first letter lands. Its last beat, the fade, is
 * the app's to play over the page. Written by the render, beside the movie;
 * never by hand.
 */
type PaintMovie = {
  fps: number;
  frames: number;
  width: number;
  height: number;
  stage: Stage;
  durationMs: number;
  settings: PaintMovieSettings;
  beats: Record<
    | "blank"
    | "swipe"
    | "pop"
    | "wet"
    | "drop"
    | "settle"
    | "fall"
    | "sink"
    | "splash"
    | "hold"
    | "fade",
    Beat
  >;
  moments: { firstHit: number };
};

export const PAINT_MOVIE: PaintMovie = movie;
