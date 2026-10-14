import {
  fadeOpacity,
  POOL_MOVIE,
  poolMovieMoments,
} from "@/features/launch-intro/logic/movie/pool-movie";
import { POOL_MOVIE_SETTINGS } from "@/features/launch-intro/logic/movie/pool-movie-settings";

describe("the pool intro's movie", () => {
  it("was made with the app's own settings for it, so it plays what the app would", () => {
    expect(POOL_MOVIE.settings).toEqual(POOL_MOVIE_SETTINGS);
  });

  it("runs until the fade to the page is over", () => {
    expect(POOL_MOVIE.durationMs).toBeGreaterThanOrEqual(POOL_MOVIE.beats.fade.end);
  });

  it("fades for as long as its settings say", () => {
    const { fade } = POOL_MOVIE.beats;
    expect(fade.end - fade.start).toBeCloseTo(POOL_MOVIE_SETTINGS.fadeMs, 0);
  });

  it("plays at 120 frames a second", () => {
    expect(POOL_MOVIE.fps).toBe(120);
  });
});

describe("poolMovieMoments", () => {
  const film = {
    beats: { splash: { start: 6900, end: 7950 }, fade: { start: 8250, end: 8850 } },
    moments: { firstHit: 6720 },
  };

  it("buzzes as the first letter lands and as the pool erupts", () => {
    const moments = poolMovieMoments(film);

    expect(moments.firstHit).toBe(6720);
    expect(moments.splashStart).toBe(6900);
  });

  it("shows the page as the water starts to fade, and is done once it has", () => {
    const moments = poolMovieMoments(film);

    expect(moments.revealAt).toBe(8250);
    expect(moments.doneAt).toBe(8850);
  });
});

describe("fadeOpacity", () => {
  const fade = { start: 8000, end: 8600 };

  it("is the whole movie until the fade starts", () => {
    expect(fadeOpacity(0, fade)).toBe(1);
    expect(fadeOpacity(8000, fade)).toBe(1);
  });

  it("fades evenly to nothing over the fade", () => {
    expect(fadeOpacity(8300, fade)).toBeCloseTo(0.5, 6);
    expect(fadeOpacity(8600, fade)).toBe(0);
  });

  it("stays gone after the fade", () => {
    expect(fadeOpacity(9000, fade)).toBe(0);
  });

  it("is gone at once when there's no fade", () => {
    expect(fadeOpacity(8000, { start: 8000, end: 8000 })).toBe(1);
    expect(fadeOpacity(8001, { start: 8000, end: 8000 })).toBe(0);
  });
});
