import { PAINT_MOVIE } from "@/features/launch-intro/logic/movie/paint-movie";
import { PAINT_MOVIE_SETTINGS } from "@/features/launch-intro/logic/movie/paint-movie-settings";

describe("the paint intro's movie", () => {
  it("was made with the app's own settings for it, so it plays what the app would", () => {
    expect(PAINT_MOVIE.settings).toEqual(PAINT_MOVIE_SETTINGS);
  });

  it("runs until the hand-over to the page is over", () => {
    expect(PAINT_MOVIE.durationMs).toBeGreaterThanOrEqual(PAINT_MOVIE.beats.fade.end);
  });

  it("hands over to the page for as long as its settings say", () => {
    const { fade } = PAINT_MOVIE.beats;
    expect(fade.end - fade.start).toBeCloseTo(PAINT_MOVIE_SETTINGS.fadeMs, 0);
  });

  it("holds the full white just before it hands over", () => {
    expect(PAINT_MOVIE.beats.hold.end).toBeCloseTo(PAINT_MOVIE.beats.fade.start, 0);
  });

  it("knows when its first letter lands, for the haptic", () => {
    const { fall } = PAINT_MOVIE.beats;
    expect(PAINT_MOVIE.moments.firstHit).toBeGreaterThan(fall.start);
    expect(PAINT_MOVIE.moments.firstHit).toBeLessThan(fall.end);
  });

  it("plays at 120 frames a second", () => {
    expect(PAINT_MOVIE.fps).toBe(120);
  });
});
