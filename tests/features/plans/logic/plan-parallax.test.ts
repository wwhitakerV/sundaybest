import {
  getArtworkDrift,
  getArtworkOpacity,
  getArtworkScale,
  getPullZoom,
  hasHeroCleared,
  isContinueHandedOff,
} from "@/features/plans/logic/plan-parallax";

describe("getArtworkDrift", () => {
  it("holds the artwork back, rising at half the scroll", () => {
    expect(getArtworkDrift(0)).toBe(0);
    expect(getArtworkDrift(200)).toBe(100);
  });

  it("doesn't hold it back when pulled past the top — it moves with the words, as one", () => {
    expect(getArtworkDrift(-80)).toBe(0);
  });
});

describe("isContinueHandedOff", () => {
  // Continue sits 400pt down the page; the nav buttons' top is 67pt down the screen.
  it("keeps Continue in the hero while it's below the nav buttons", () => {
    expect(isContinueHandedOff(0, 400, 67)).toBe(false);
    expect(isContinueHandedOff(332, 400, 67)).toBe(false);
  });

  it("hands it to the tab bar once it's up level with them", () => {
    expect(isContinueHandedOff(333, 400, 67)).toBe(true);
    expect(isContinueHandedOff(900, 400, 67)).toBe(true);
  });

  it("never before Continue's place is known", () => {
    expect(isContinueHandedOff(900, 0, 67)).toBe(false);
  });
});

describe("getArtworkOpacity", () => {
  it("shows the artwork whole at rest", () => {
    expect(getArtworkOpacity(0)).toBe(1);
  });

  it("keeps it whole when the page is pulled down past the top", () => {
    expect(getArtworkOpacity(-60)).toBe(1);
  });

  it("fades it slowly as the page scrolls", () => {
    expect(getArtworkOpacity(150)).toBeCloseTo(0.6);
  });

  it("never fades it out entirely", () => {
    expect(getArtworkOpacity(300)).toBeCloseTo(0.2);
    expect(getArtworkOpacity(2000)).toBeCloseTo(0.2);
  });
});

describe("getArtworkScale", () => {
  it("shows the artwork full size at rest", () => {
    expect(getArtworkScale(0)).toBe(1);
  });

  it("doesn't shrink it when the page is pulled down past the top", () => {
    expect(getArtworkScale(-60)).toBe(1);
  });

  it("shrinks it slowly as the page scrolls — more slowly than it fades", () => {
    expect(getArtworkScale(225)).toBeCloseTo(0.925);
  });

  it("never shrinks it by more than 15%", () => {
    expect(getArtworkScale(450)).toBeCloseTo(0.85);
    expect(getArtworkScale(2000)).toBeCloseTo(0.85);
  });
});

describe("getPullZoom", () => {
  it("leaves the hero's colour as it is at rest and scrolling up", () => {
    expect(getPullZoom(0, 700)).toBe(1);
    expect(getPullZoom(250, 700)).toBe(1);
  });

  it("zooms it from its foot just enough to reach the top of the screen when pulled down", () => {
    // Pulled 70pt down: the 700pt hero's colour must now span 770pt.
    expect(getPullZoom(-70, 700)).toBeCloseTo(770 / 700);
  });

  it("leaves it be until the hero's measured", () => {
    expect(getPullZoom(-70, 0)).toBe(1);
  });
});

describe("hasHeroCleared", () => {
  // A 700pt hero; the nav buttons' middle 91pt down the screen.
  it("keeps what's at that line over the hero at rest", () => {
    expect(hasHeroCleared(0, 700, 91)).toBe(false);
  });

  it("has it over the page once the hero's bottom edge has scrolled up past it", () => {
    expect(hasHeroCleared(608, 700, 91)).toBe(false);
    expect(hasHeroCleared(609, 700, 91)).toBe(true);
  });

  it("never before the hero's measured", () => {
    expect(hasHeroCleared(2000, 0, 91)).toBe(false);
  });
});
