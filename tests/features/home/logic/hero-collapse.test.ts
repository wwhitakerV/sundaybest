import {
  getArtworkRect,
  getBarProgress,
  getBarThumbRect,
  getCollapseGeometry,
  getCollapsePhase,
  getCollapseProgress,
  getFlightRect,
  getHeaderOpacity,
  getHeroContentOpacity,
  getHeroCornerRadius,
  getHeroPin,
  getSnapOffsets,
  isHeroMeasurable,
} from "@/features/home/logic/hero-collapse";

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

describe("getCollapseGeometry", () => {
  it("works out where the hero reaches the header and the phone's top, and how far it collapses", () => {
    expect(GEOMETRY).toEqual({
      headerCross: 24,
      screenTop: 156,
      statusBar: 59,
      heroHeight: 520,
      collapseRange: 401,
    });
  });
});

describe("getHeaderOpacity", () => {
  it("shows the header at rest", () => {
    expect(getHeaderOpacity(0, GEOMETRY)).toBe(1);
  });

  it("holds it whole until the hero's most of the way to it", () => {
    expect(getHeaderOpacity(12, GEOMETRY)).toBe(1);
    expect(getHeaderOpacity(24 * 0.8, GEOMETRY)).toBeCloseTo(1);
  });

  it("then fades it with the scroll", () => {
    expect(getHeaderOpacity(24 * 1.3, GEOMETRY)).toBeCloseTo(0.5);
  });

  it("has it gone once the hero's well over it", () => {
    expect(getHeaderOpacity(24 * 1.8, GEOMETRY)).toBe(0);
    expect(getHeaderOpacity(300, GEOMETRY)).toBe(0);
  });

  it("keeps it whole when pulled down past the top", () => {
    expect(getHeaderOpacity(-40, GEOMETRY)).toBe(1);
  });
});

describe("getHeroCornerRadius", () => {
  it("keeps the hero's corners round well below the top", () => {
    expect(getHeroCornerRadius(0, GEOMETRY)).toBe(36);
  });

  it("straightens them as the hero nears the top of the phone", () => {
    expect(getHeroCornerRadius(156 - 50, GEOMETRY)).toBe(18);
  });

  it("has them square once it's there", () => {
    expect(getHeroCornerRadius(156, GEOMETRY)).toBe(0);
    expect(getHeroCornerRadius(900, GEOMETRY)).toBe(0);
  });
});

describe("getCollapseProgress", () => {
  it("hasn't begun until the hero reaches the top of the phone", () => {
    expect(getCollapseProgress(0, GEOMETRY)).toBe(0);
    expect(getCollapseProgress(156, GEOMETRY)).toBe(0);
  });

  it("goes point for point with the scroll, over the hero's height less the bar's", () => {
    expect(getCollapseProgress(at(0.5), GEOMETRY)).toBeCloseTo(0.5);
  });

  it("is done once the hero's the bar's height", () => {
    expect(getCollapseProgress(at(1), GEOMETRY)).toBe(1);
    expect(getCollapseProgress(2000, GEOMETRY)).toBe(1);
  });
});

describe("getHeroPin", () => {
  it("leaves the hero whole, scrolling as it does, until it reaches the top", () => {
    expect(getHeroPin(100, GEOMETRY)).toEqual({ offset: 0, height: 520 });
  });

  it("then holds it at the top, a point shorter for every point scrolled", () => {
    expect(getHeroPin(156 + 100, GEOMETRY)).toEqual({ offset: 100, height: 420 });
  });

  it("stops at the bar's height, and stays there", () => {
    expect(getHeroPin(2000, GEOMETRY)).toEqual({ offset: 401, height: 119 });
  });

  it("keeps the list attached: the hero's bottom is always where the list starts", () => {
    for (const scrolled of [0, 156, at(0.4), at(1)]) {
      const pin = getHeroPin(scrolled, GEOMETRY);
      const heroTop = Math.max(0, 156 - scrolled);
      const listTop = 156 + 520 - scrolled;
      expect(heroTop + pin.height).toBeCloseTo(listTop);
    }
  });
});

describe("getHeroContentOpacity", () => {
  it("shows the hero's words until the collapse begins", () => {
    expect(getHeroContentOpacity(156, GEOMETRY)).toBe(1);
  });

  it("fades them over the first part of the collapse", () => {
    expect(getHeroContentOpacity(at(0.3), GEOMETRY)).toBeCloseTo(0.5);
  });

  it("has them gone before the bar comes in", () => {
    expect(getHeroContentOpacity(at(0.6), GEOMETRY)).toBe(0);
  });
});

describe("getBarProgress", () => {
  it("keeps the plan bar away through most of the collapse", () => {
    expect(getBarProgress(at(0.6), GEOMETRY)).toBeCloseTo(0);
  });

  it("brings it in over the last of it", () => {
    expect(getBarProgress(at(0.8), GEOMETRY)).toBeCloseTo(0.5);
  });

  it("has it in as the hero reaches the bar's height", () => {
    expect(getBarProgress(at(1), GEOMETRY)).toBe(1);
  });
});

describe("getCollapsePhase", () => {
  it("leaves the header to take taps at rest, the bar hidden, the status bar dark", () => {
    expect(getCollapsePhase(0, GEOMETRY)).toEqual({
      headerTouchable: true,
      barTouchable: false,
      lightStatusBar: false,
    });
  });

  it("stops the header taking taps once it's mostly faded", () => {
    expect(getCollapsePhase(20, GEOMETRY).headerTouchable).toBe(true);
    expect(getCollapsePhase(40, GEOMETRY).headerTouchable).toBe(false);
  });

  it("turns the status bar light once the hero's colour is under it", () => {
    expect(getCollapsePhase(156 - 59, GEOMETRY).lightStatusBar).toBe(true);
  });

  it("lets the bar take taps once it's mostly in", () => {
    expect(getCollapsePhase(at(0.75), GEOMETRY).barTouchable).toBe(false);
    expect(getCollapsePhase(at(0.85), GEOMETRY).barTouchable).toBe(true);
  });
});

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
    expect(getFlightRect(0.5, from, to)).toEqual({ x: 12, y: 135.5, width: 172, height: 96.75 });
  });

  it("moves slowly at first, and quickly through the middle", () => {
    expect(getFlightRect(0.1, from, to).y).toBeGreaterThan(200 - (200 - 71) * 0.1);
  });
});

/**
 * How React Native's iOS scroll view picks where a let-go scroll lands, given
 * snap points (`scrollViewWillEndDragging` in RCTScrollViewComponentView),
 * with `snapToStart` and `snapToEnd` off: the snap points either side of
 * where the flick would naturally land, then one by the flick's direction.
 */
function landing(
  offsets: readonly number[],
  from: number,
  natural: number,
  velocity: number,
  maximum: number,
): number {
  let smaller = 0;
  let larger = maximum;
  for (const offset of offsets) {
    if (offset <= natural && natural - offset < natural - smaller) smaller = offset;
    if (offset >= natural && offset - natural < larger - natural) larger = offset;
  }
  const first = offsets.at(0) ?? 0;
  const last = offsets.at(-1) ?? maximum;
  if (natural >= last) return from >= last ? natural : last;
  if (natural <= first) return from <= first ? natural : first;
  if (velocity > 0) return larger;
  if (velocity < 0) return smaller;
  return natural - smaller < larger - natural ? smaller : larger;
}

describe("getSnapOffsets", () => {
  // The page scrolls 1,400pt at most; the collapse runs from 156 to 557.
  const OFFSETS = getSnapOffsets(GEOMETRY, 1400);

  it("marks both ends of the collapse, and nothing inside it", () => {
    expect(OFFSETS).toContain(156);
    expect(OFFSETS).toContain(557);
    expect(OFFSETS.filter((offset) => offset > 156 && offset < 557)).toEqual([]);
  });

  it("marks the rest of the page densely, from its top to its bottom", () => {
    expect(OFFSETS.at(0)).toBe(0);
    expect(OFFSETS.at(-1)).toBeGreaterThanOrEqual(1400);
  });

  it("lets a hard flick up out of the collapse coast on, as far as it would", () => {
    expect(landing(OFFSETS, 300, 1100, 3, 1400)).toBeCloseTo(1100, -1);
  });

  it("lets a hard flick down out of the collapse coast on, back past its start", () => {
    expect(landing(OFFSETS, 400, 60, -3, 1400)).toBeCloseTo(60, -1);
  });

  it("still finishes a flick that would stop mid-collapse — up to fully in", () => {
    expect(landing(OFFSETS, 300, 420, 0.8, 1400)).toBe(557);
  });

  it("…or back down to fully open", () => {
    expect(landing(OFFSETS, 400, 300, -0.8, 1400)).toBe(156);
  });

  it("leaves the rest of the page to scroll as it always has", () => {
    expect(landing(OFFSETS, 800, 1000, 2, 1400)).toBeCloseTo(1000, -1);
  });

  it("gives none before the hero's measured — nothing can collapse yet", () => {
    const unmeasured = getCollapseGeometry({
      insetTop: 59,
      headerBottom: 73,
      scrollTop: 89,
      contentTop: 8,
      heroHeight: 0,
      barHeight: 119,
    });

    expect(getSnapOffsets(unmeasured, 1400)).toEqual([]);
  });
});

describe("isHeroMeasurable", () => {
  it("takes the hero's height while it's whole — at rest, or on its way to the top", () => {
    expect(isHeroMeasurable(0, GEOMETRY)).toBe(true);
    expect(isHeroMeasurable(156, GEOMETRY)).toBe(true);
  });

  it("never while it's collapsing, when it's shorter than it really is", () => {
    expect(isHeroMeasurable(157, GEOMETRY)).toBe(false);
    expect(isHeroMeasurable(at(0.95), GEOMETRY)).toBe(false);
  });
});
