import {
  getArtworkDrift,
  getArtworkOpacity,
  getArtworkScale,
  isContinueHandedOff,
} from "@/features/plans/logic/plan-parallax";

describe("getArtworkDrift", () => {
  it("holds the artwork back, rising at half the scroll", () => {
    expect(getArtworkDrift(0)).toBe(0);
    expect(getArtworkDrift(200)).toBe(100);
  });

  it("lets it follow the page down, half as far, when pulled past the top", () => {
    expect(getArtworkDrift(-80)).toBe(-40);
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

  it("keeps it full size when the page is pulled down past the top", () => {
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
