import { getPlanArtworkFrame } from "@/features/plans/logic/plan-artwork";

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
    expect(FRAME.top).toBe(116 + 24);
  });

  it("gives where its bottom edge falls, for the words to start under", () => {
    expect(FRAME.bottom).toBeCloseTo(FRAME.top + FRAME.height);
  });
});
