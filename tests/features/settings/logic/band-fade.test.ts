import { hasClearedFade } from "@/features/settings/logic/band-fade";

describe("hasClearedFade", () => {
  // An 800pt screen whose bottom fade reaches 100pt up: its top edge is 700pt down.
  const screen = { viewportHeight: 800, fadeHeight: 100 };

  it("is false while the line is still down in the fade", () => {
    expect(hasClearedFade({ ...screen, lineY: 1000, scrollY: 250 })).toBe(false);
  });

  it("is true once the line has risen to the fade's top edge", () => {
    expect(hasClearedFade({ ...screen, lineY: 1000, scrollY: 300 })).toBe(true);
  });

  it("is true once the line is above it", () => {
    expect(hasClearedFade({ ...screen, lineY: 1000, scrollY: 420 })).toBe(true);
  });

  it("is false before the line has been measured", () => {
    expect(hasClearedFade({ ...screen, lineY: null, scrollY: 5000 })).toBe(false);
  });
});
