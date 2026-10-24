import { fadeOpacity, holdsFor, movieMoments } from "@/features/launch-intro/logic/movie/movie";
import { PAINT_MOVIE } from "@/features/launch-intro/logic/movie/paint-movie";

const { stage } = PAINT_MOVIE;

describe("holdsFor", () => {
  const { hold } = PAINT_MOVIE.beats;

  it("plays on until the screen is full white", () => {
    expect(holdsFor(hold.start - 10, false, hold.start)).toBe(false);
  });

  it("holds the full screen while the page underneath isn't ready", () => {
    expect(holdsFor(hold.start + 10, false, hold.start)).toBe(true);
  });

  it("plays on once the page is ready", () => {
    expect(holdsFor(hold.start + 10, true, hold.start)).toBe(false);
  });
});

describe("movieMoments", () => {
  const film = {
    beats: { splash: { start: 6900, end: 7950 }, fade: { start: 8250, end: 8850 } },
    moments: { firstHit: 6720 },
  };

  it("buzzes as the first letter lands and as the pool erupts", () => {
    const moments = movieMoments(film);

    expect(moments.firstHit).toBe(6720);
    expect(moments.splashStart).toBe(6900);
  });

  it("shows the page as the movie starts to fade, and is done once it has", () => {
    const moments = movieMoments(film);

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

  it("is gone at once when there's no fade, as the paint movie's is", () => {
    expect(fadeOpacity(8000, { start: 8000, end: 8000 })).toBe(1);
    expect(fadeOpacity(8001, { start: 8000, end: 8000 })).toBe(0);
  });
});
