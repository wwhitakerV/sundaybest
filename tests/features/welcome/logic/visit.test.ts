import { FIRST_VISIT, onAppeared, onLeft } from "@/features/welcome/logic/visit";

describe("a screen's visits", () => {
  it("starts playing, on its first visit", () => {
    expect(FIRST_VISIT).toEqual({ count: 0, playing: true });
  });

  it("stops playing once it is being left", () => {
    expect(onLeft(FIRST_VISIT)).toEqual({ count: 0, playing: false });
  });

  it("starts a new visit once it has come back into view", () => {
    expect(onAppeared(onLeft(FIRST_VISIT))).toEqual({ count: 1, playing: true });
  });

  it("doesn't start a new visit while it's still playing", () => {
    expect(onAppeared(FIRST_VISIT)).toBe(FIRST_VISIT);
  });

  it("ignores being left a second time", () => {
    const left = onLeft(FIRST_VISIT);

    expect(onLeft(left)).toBe(left);
  });
});
