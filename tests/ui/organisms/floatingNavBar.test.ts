import {
  FLOATING_NAV_BAR_CLEARANCE,
  getFloatingNavBarBottom,
  getFloatingNavBarClearance,
  getFloatingNavBarTintHeight,
} from "@/ui/organisms/floatingNavBar";

describe("getFloatingNavBarBottom", () => {
  it("sits a bar's capsule a little into the home indicator's strip on a phone that has one", () => {
    expect(getFloatingNavBarBottom(34)).toBe(28);
  });

  it("keeps it clear of the edge on a phone with no bottom inset", () => {
    expect(getFloatingNavBarBottom(0)).toBe(16);
  });
});

describe("getFloatingNavBarTintHeight", () => {
  it("reaches from the screen's bottom edge to a little above the capsule", () => {
    expect(getFloatingNavBarTintHeight(26)).toBe(26 + 62 + 16);
  });
});

describe("getFloatingNavBarClearance", () => {
  it("leaves room, above a screen's safe area, for the bar and the tint above it", () => {
    // The capsule sits 28 up on a 34-inset phone — 6 into the safe area — then 62 of capsule and 16 of tint.
    expect(getFloatingNavBarClearance(34)).toBe(-6 + 62 + 16);
  });

  it("measures from the screen's edge on a phone with no bottom inset", () => {
    expect(getFloatingNavBarClearance(0)).toBe(16 + 62 + 16);
  });
});

describe("FLOATING_NAV_BAR_CLEARANCE", () => {
  it("is the room a tab screen leaves under its content: the capsule, its bottom margin, and a side margin's worth more", () => {
    expect(FLOATING_NAV_BAR_CLEARANCE).toBe(62 + 22 + 17);
  });
});
