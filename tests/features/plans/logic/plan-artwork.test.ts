import { getPlanArtworkFrame, getPlanCoverFade } from "@/features/plans/logic/plan-artwork";

// A 393pt-wide phone with a 24pt page inset, the nav buttons' bottom 116pt down.
const FRAME = getPlanArtworkFrame({ screenWidth: 393, inset: 24, navBottom: 116 });

describe("getPlanArtworkFrame", () => {
  it("makes the artwork 82% of the page's width, at the thumbnail's 16:9", () => {
    expect(FRAME.width).toBeCloseTo(345 * 0.82);
    expect(FRAME.height).toBeCloseTo((345 * 0.82 * 9) / 16);
  });

  it("centres it across the screen", () => {
    expect(FRAME.left).toBeCloseTo((393 - 345 * 0.82) / 2);
  });

  it("sits it a little below the nav buttons", () => {
    expect(FRAME.top).toBe(116 + 16);
  });

  it("gives where its bottom edge falls, for the words to start under", () => {
    expect(FRAME.bottom).toBeCloseTo(FRAME.top + FRAME.height);
  });
});

describe("getPlanCoverFade", () => {
  // The artwork's bottom 291pt down a 600pt hero: 309pt of content under it.
  const FADE = getPlanCoverFade({ artworkBottom: 291, heroHeight: 600 });

  it("starts the colour coming in at the artwork's bottom edge, clear there", () => {
    expect(FADE?.from).toBe(291);
  });

  it("brings it in over three quarters of the content below it", () => {
    expect(FADE?.to).toBeCloseTo(291 + 309 * 0.75);
  });

  it("gives none until the hero's measured", () => {
    expect(getPlanCoverFade({ artworkBottom: 291, heroHeight: 0 })).toBeNull();
  });
});
