import {
  getArtworkRect,
  getBarThumbRect,
  getFlightHandoff,
  getFlightProgress,
  getFlightRect,
} from "@/features/home/logic/artwork-flight";
import { getCollapseGeometry } from "@/features/home/logic/hero-collapse";

// A phone with a 59pt status bar; the header's bottom 73pt down the page, and
// the scroll view starting 16 below it, its content 8 further in. The hero is
// 520pt tall, and collapses into a bar 119pt tall (the status bar's 59, and
// its 60pt row).
const GEOMETRY = getCollapseGeometry({
  insetTop: 59,
  headerBottom: 73,
  scrollTop: 89,
  contentTop: 8,
  heroHeight: 520,
  barHeight: 119,
});

/** The scroll at a point in the collapse, 0–1. */
const at = (progress: number) => 156 + 401 * progress;

// A 393pt-wide phone: the hero's artwork at 82% of the page's width inside
// its 24pt inset, 52pt down inside the hero; the bar's thumbnail 64pt wide.
const FRAME = { screenWidth: 393, inset: 24, widthRatio: 0.82, breatheTop: 52 };

describe("getArtworkRect", () => {
  it("places the hero's artwork where it sits on screen, centred", () => {
    const rect = getArtworkRect(0, GEOMETRY, FRAME);

    expect(rect.width).toBeCloseTo(345 * 0.82);
    expect(rect.x).toBeCloseTo((393 - 345 * 0.82) / 2);
    expect(rect.y).toBe(156 + 52);
    expect(rect.height).toBeCloseTo((345 * 0.82 * 9) / 16);
  });

  it("carries it up with the scroll", () => {
    expect(getArtworkRect(100, GEOMETRY, FRAME).y).toBe(156 + 52 - 100);
  });

  it("holds it with the hero once the hero's pinned to the top", () => {
    expect(getArtworkRect(at(0.5), GEOMETRY, FRAME).y).toBe(52);
  });
});

describe("getFlightProgress", () => {
  it("hasn't begun at rest", () => {
    expect(getFlightProgress(0, GEOMETRY)).toBe(0);
  });

  it("begins as soon as the hero moves, before it reaches the top", () => {
    expect(getFlightProgress(50, GEOMETRY)).toBeCloseTo(50 / 557);
  });

  it("lands as the collapse does", () => {
    expect(getFlightProgress(at(1), GEOMETRY)).toBe(1);
    expect(getFlightProgress(2000, GEOMETRY)).toBe(1);
  });

  it("stays put when the page is pulled down past the top", () => {
    expect(getFlightProgress(-40, GEOMETRY)).toBe(0);
  });

  it("doesn't fly before the hero's measured", () => {
    const unmeasured = getCollapseGeometry({
      insetTop: 59,
      headerBottom: 73,
      scrollTop: 89,
      contentTop: 8,
      heroHeight: 0,
      barHeight: 119,
    });

    expect(getFlightProgress(100, unmeasured)).toBe(0);
  });
});

describe("getFlightHandoff", () => {
  it("leaves the hero's own artwork showing at rest", () => {
    expect(getFlightHandoff(0)).toBe(0);
  });

  it("fades the flying copy in over the first of the scroll, so the words' colour over the artwork fades rather than pops", () => {
    expect(getFlightHandoff(12)).toBeCloseTo(0.5);
  });

  it("has the copy whole a little way in", () => {
    expect(getFlightHandoff(24)).toBe(1);
    expect(getFlightHandoff(400)).toBe(1);
  });

  it("stays with the hero's artwork when pulled down", () => {
    expect(getFlightHandoff(-30)).toBe(0);
  });
});

describe("getBarThumbRect", () => {
  it("places the bar's thumbnail at its inset, centred in the bar's row", () => {
    expect(getBarThumbRect(59, 24)).toEqual({ x: 24, y: 59 + 12, width: 64, height: 36 });
  });
});

describe("getFlightRect", () => {
  const from = { x: 0, y: 200, width: 280, height: 157.5 };
  const to = { x: 24, y: 71, width: 64, height: 36 };

  it("starts on the hero's artwork and lands on the bar's thumbnail", () => {
    expect(getFlightRect(0, from, to)).toEqual(from);
    expect(getFlightRect(1, from, to)).toEqual(to);
  });

  it("eases between them — halfway through, halfway there", () => {
    const halfway = getFlightRect(0.5, from, to);

    expect(halfway.x).toBeCloseTo(12);
    expect(halfway.y).toBeCloseTo(135.5);
    expect(halfway.width).toBeCloseTo(172);
    expect(halfway.height).toBeCloseTo(96.75);
  });

  it("moves slowly at first, and quickly through the middle", () => {
    expect(getFlightRect(0.1, from, to).y).toBeGreaterThan(200 - (200 - 71) * 0.1);
  });

  it("is well on its way by the time the hero reaches the top — about a quarter through", () => {
    // 156 of 557pt: the hero's risen to the top, and the artwork's visibly flying.
    expect(getFlightRect(156 / 557, from, to).y).toBeLessThan(200 - (200 - 71) * 0.15);
  });
});
