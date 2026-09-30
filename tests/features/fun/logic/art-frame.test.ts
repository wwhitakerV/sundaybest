import { fitArt, getArtFrame } from "@/features/fun/logic/art-frame";

// A 178 × 91 pt tile, as the mockup's Play now tiles.
const TILE = { width: 178, height: 91 };

describe("getArtFrame", () => {
  it("sizes the art to its share of the card's width, keeping its own shape", () => {
    const frame = getArtFrame(TILE, { share: 0.5, aspect: 2, right: 0, anchor: "centre" });

    expect(frame.width).toBeCloseTo(89);
    expect(frame.height).toBeCloseTo(44.5);
  });

  it("centres it top to bottom", () => {
    const frame = getArtFrame(TILE, { share: 0.5, aspect: 2, right: 0, anchor: "centre" });

    expect(frame.top).toBeCloseTo((91 - 44.5) / 2);
  });

  it("can sit it on the card's bottom edge instead", () => {
    const frame = getArtFrame(TILE, { share: 0.5, aspect: 2, right: 0, anchor: "bottom" });

    expect(frame.top).toBeCloseTo(91 - 44.5);
  });

  it("sets it in from the right edge by a share of the card's width — or over it, when negative", () => {
    expect(
      getArtFrame(TILE, { share: 0.5, aspect: 2, right: 0.02, anchor: "centre" }).right,
    ).toBeCloseTo(3.56);
    expect(
      getArtFrame(TILE, { share: 0.5, aspect: 2, right: -0.04, anchor: "centre" }).right,
    ).toBeCloseTo(-7.12);
  });
});

describe("fitArt", () => {
  it("fills its share of the space's width, keeping its own shape, when there's the height for it", () => {
    expect(fitArt({ width: 150, height: 120 }, { share: 0.8, aspect: 2 })).toEqual({
      width: 120,
      height: 60,
    });
  });

  it("gives way to the space's height when there isn't", () => {
    expect(fitArt({ width: 150, height: 60 }, { share: 1, aspect: 1 })).toEqual({
      width: 60,
      height: 60,
    });
  });

  it("can be made a few points larger or smaller than it would fit, keeping its shape", () => {
    expect(fitArt({ width: 150, height: 120 }, { share: 0.8, aspect: 2, extra: 8 })).toEqual({
      width: 128,
      height: 64,
    });
    expect(fitArt({ width: 150, height: 120 }, { share: 0.8, aspect: 2, extra: -8 })).toEqual({
      width: 112,
      height: 56,
    });
  });

  it("is nothing until the space is measured", () => {
    expect(fitArt({ width: 0, height: 0 }, { share: 1, aspect: 1 })).toEqual({
      width: 0,
      height: 0,
    });
  });
});
