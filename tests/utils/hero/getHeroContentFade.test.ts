import { getHeroContentFade } from "@/utils/hero/getHeroContentFade";

// An artwork 159pt tall with its bottom edge 291pt down a 700pt hero: 409pt
// of content under it.
const FADE = getHeroContentFade({ artworkBottom: 291, artworkHeight: 159, heroHeight: 700 });

describe("getHeroContentFade", () => {
  it("starts the content's colour an eighth of the way up the artwork, clear there", () => {
    expect(FADE?.from).toBeCloseTo(291 - 159 / 8);
  });

  it("has it solid three quarters of the way down the content, raised by as much", () => {
    expect(FADE?.to).toBeCloseTo(291 + 409 * 0.75 - 159 / 8);
  });

  it("gives none until the hero's measured", () => {
    expect(
      getHeroContentFade({ artworkBottom: 291, artworkHeight: 159, heroHeight: 0 }),
    ).toBeNull();
  });
});
