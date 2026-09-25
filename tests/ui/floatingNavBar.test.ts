import { getFloatingNavBarBottom, getFloatingNavBarTintHeight } from "@/ui/floatingNavBar";

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
