import { FIRST_VISIT, onAppeared, onDisappeared } from "@/features/welcome/logic/visit";

describe("a screen's visits", () => {
  it("starts in view, on its first visit", () => {
    expect(FIRST_VISIT).toEqual({ count: 0, visible: true });
  });

  it("goes out of view once it has disappeared", () => {
    expect(onDisappeared(FIRST_VISIT)).toEqual({ count: 0, visible: false });
  });

  it("starts a new visit once it has come back into view", () => {
    expect(onAppeared(onDisappeared(FIRST_VISIT))).toEqual({ count: 1, visible: true });
  });

  it("doesn't start a new visit while it's still in view", () => {
    expect(onAppeared(FIRST_VISIT)).toBe(FIRST_VISIT);
  });

  it("ignores a second disappearance", () => {
    const gone = onDisappeared(FIRST_VISIT);

    expect(onDisappeared(gone)).toBe(gone);
  });
});
