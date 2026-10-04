import { buttonSpring } from "@/ui/organisms/tab-bar/use-tab-bar-minimize";

describe("the tab bar button's spring", () => {
  it("bounces into place as the button comes in", () => {
    expect(buttonSpring(true).overshootClamping).toBeFalsy();
  });

  it("never swings past hidden as it leaves, so it can't flash back into view", () => {
    expect(buttonSpring(false).overshootClamping).toBe(true);
  });
});
