import { shouldAnimateHeaderArrival } from "@/utils/navigation/shouldAnimateHeaderArrival";

const TAB_ROOTS = ["(tabs)/home/index", "(tabs)/plans/index", "(tabs)/fun", "(tabs)/progress"];
const HOME = { key: "home-index", path: "(tabs)/home/index" };
const FUN = { key: "fun", path: "(tabs)/fun" };
const PLAN_DETAIL = { key: "plan", path: "(tabs)/home/[planId]" };
const SETTINGS = { key: "settings", path: "(tabs)/settings/index" };

describe("shouldAnimateHeaderArrival", () => {
  it("never animates going from one tab root to another", () => {
    expect(shouldAnimateHeaderArrival({ from: HOME, to: FUN, tabRoots: TAB_ROOTS })).toBe(false);
  });

  it("animates a tab root arrived at from a screen that isn't one", () => {
    expect(shouldAnimateHeaderArrival({ from: SETTINGS, to: FUN, tabRoots: TAB_ROOTS })).toBe(true);
  });

  it("animates a tab root arrived at from a screen in another tab's stack", () => {
    const plansRoot = { key: "plans-index", path: "(tabs)/plans/index" };

    expect(
      shouldAnimateHeaderArrival({ from: PLAN_DETAIL, to: plansRoot, tabRoots: TAB_ROOTS }),
    ).toBe(true);
  });

  it("animates any other screen arrived at", () => {
    expect(shouldAnimateHeaderArrival({ from: HOME, to: PLAN_DETAIL, tabRoots: TAB_ROOTS })).toBe(
      true,
    );
  });

  it("animates the first screen it knows of, as it arrives", () => {
    expect(shouldAnimateHeaderArrival({ from: undefined, to: HOME, tabRoots: TAB_ROOTS })).toBe(
      true,
    );
  });
});
