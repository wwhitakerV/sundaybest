import { coverFit, holdsFor, MOVIE } from "@/features/launch-intro/logic/movie/movie";
import { buildWaterScene } from "@/features/launch-intro/logic/water/scene";
import { WATER_SETTINGS } from "@/features/launch-intro/logic/water/settings";

const scene = buildWaterScene(WATER_SETTINGS, MOVIE.stage);

describe("the water intro's movie", () => {
  it("was made with the app's own settings, so it plays what the app would", () => {
    expect(MOVIE.settings).toEqual(WATER_SETTINGS);
  });

  it("has the app's beats, to the millisecond, so the app's moments land on its frames", () => {
    for (const [key, beat] of Object.entries(scene.beats)) {
      const filmed = MOVIE.beats[key as keyof typeof MOVIE.beats];
      expect(filmed.start).toBeCloseTo(beat.start, 0);
      expect(filmed.end).toBeCloseTo(beat.end, 0);
    }
  });

  it("runs until the last of the water has left the screen", () => {
    expect(MOVIE.durationMs).toBeGreaterThanOrEqual(scene.total);
  });

  it("plays at 120 frames a second", () => {
    expect(MOVIE.fps).toBe(120);
  });
});

describe("coverFit", () => {
  it("fills a taller screen, cropping its sides evenly", () => {
    const fit = coverFit(MOVIE.stage, { width: 390, height: 900 });

    expect(fit.scale * MOVIE.stage.height).toBeCloseTo(900, 6);
    expect(fit.scale * MOVIE.stage.width).toBeGreaterThanOrEqual(390);
    expect(fit.dx).toBeCloseTo((390 - fit.scale * MOVIE.stage.width) / 2, 6);
    expect(fit.dy).toBeCloseTo(0, 6);
  });

  it("fills a wider screen, cropping its top and bottom evenly", () => {
    const fit = coverFit(MOVIE.stage, { width: 440, height: 900 });

    expect(fit.scale * MOVIE.stage.width).toBeCloseTo(440, 6);
    expect(fit.dy).toBeCloseTo((900 - fit.scale * MOVIE.stage.height) / 2, 6);
  });

  it("is the movie as it is on its own screen", () => {
    expect(coverFit(MOVIE.stage, MOVIE.stage)).toEqual({ scale: 1, dx: 0, dy: 0 });
  });
});

describe("holdsFor", () => {
  const { hold } = scene.beats;

  it("plays on until the screen is full of water", () => {
    expect(holdsFor(hold.start - 10, false, hold.start)).toBe(false);
  });

  it("holds the full screen while the page underneath isn't ready", () => {
    expect(holdsFor(hold.start + 10, false, hold.start)).toBe(true);
  });

  it("plays on once the page is ready", () => {
    expect(holdsFor(hold.start + 10, true, hold.start)).toBe(false);
  });
});
