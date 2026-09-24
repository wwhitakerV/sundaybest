import { getStepTransitionTiming } from "@/utils/motion/getStepTransitionTiming";

describe("getStepTransitionTiming", () => {
  it("keeps the brisk swap the app has used: out quick, in quick, no stagger", () => {
    expect(getStepTransitionTiming("brisk", false)).toEqual({
      outMs: 110,
      inMs: 150,
      rise: 8,
      staggerMs: 0,
      fadeWithReducedMotion: false,
    });
  });

  it("brings content in calmly for reading: a longer fade in, and the body a beat after its title", () => {
    expect(getStepTransitionTiming("calm", false)).toEqual({
      outMs: 110,
      inMs: 240,
      rise: 8,
      staggerMs: 50,
      fadeWithReducedMotion: true,
    });
  });

  it("drops the rise but keeps the fade for a user who reduces motion", () => {
    const timing = getStepTransitionTiming("calm", true);

    expect(timing.rise).toBe(0);
    expect(timing.fadeWithReducedMotion).toBe(true);
  });

  it("leaves the brisk swap to the system when motion is reduced, as before", () => {
    expect(getStepTransitionTiming("brisk", true)).toEqual(getStepTransitionTiming("brisk", false));
  });
});
