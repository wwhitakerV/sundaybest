import type { Stage } from "../settings";
import type { WaterSettings } from "../water/settings";
import movie from "./water-movie.json";

type Beat = { start: number; end: number };

/**
 * The water intro as a movie (`assets/intro/water-intro.mp4`), made from its
 * prototype by `npm run render:intro`: its size and frame rate, the stage it
 * was drawn on (in the prototype's points), the settings it was made with, and
 * where its beats fall. Written by the render, beside the movie; never by hand.
 */
type Movie = {
  fps: number;
  frames: number;
  width: number;
  height: number;
  stage: Stage;
  durationMs: number;
  settings: WaterSettings;
  beats: Record<"pour" | "write" | "pause" | "fall" | "sink" | "splash" | "hold" | "drain", Beat>;
};

export const MOVIE: Movie = movie;

/**
 * How the movie's stage fills a screen: scaled to cover it, centred, its
 * overflow cropped evenly — a point on the stage lands at `dx + x × scale`,
 * `dy + y × scale` on the screen.
 */
export function coverFit(stage: Stage, screen: Stage) {
  "worklet";
  const scale = Math.max(screen.width / stage.width, screen.height / stage.height);
  return {
    scale,
    dx: (screen.width - stage.width * scale) / 2,
    dy: (screen.height - stage.height * scale) / 2,
  };
}

/** Whether the movie holds where it is: the screen is full of water and the page isn't ready. */
export function holdsFor(t: number, ready: boolean, holdStart: number): boolean {
  "worklet";
  return !ready && t >= holdStart;
}
