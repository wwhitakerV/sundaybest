import {
  PLACE_ROUTES,
  placePageHref,
  placePlanHref,
  placePrivacyTopicHref,
  toPlace,
} from "@/entities/tabs";

describe("toPlace", () => {
  it.each(["home", "plans", "progress", "settings"] as const)("keeps the %s tab", (tab) => {
    expect(toPlace(tab, "plans")).toBe(tab);
  });

  it("keeps Plans' search, which has pages of its own", () => {
    expect(toPlace("plan-search", "plans")).toBe("plan-search");
  });

  it.each(["weeks", "plan/[planId]", "daily-reminder", "privacy/[topic]"])(
    "reads %s, over the tabs, as the app's own stack",
    (route) => {
      expect(toPlace(route, "plans")).toBe("over");
    },
  );

  it("falls back somewhere with no pages of its own (Fun, hidden)", () => {
    expect(toPlace("fun", "settings")).toBe("settings");
  });

  it("falls back with nowhere at all", () => {
    expect(toPlace(null, "plans")).toBe("plans");
  });

  it("names every route that's a place, for finding where the reader is", () => {
    expect(PLACE_ROUTES).toEqual(
      expect.arrayContaining(["plan-search", "weeks", "plan/[planId]", "text-size"]),
    );
  });
});

describe("place routes", () => {
  it("opens a plan in a tab", () => {
    expect(placePlanHref("home", "plan-1")).toEqual({
      pathname: "/(tabs)/home/[planId]",
      params: { planId: "plan-1" },
    });
  });

  it("opens a plan on top of Plans' search, in its own stack", () => {
    expect(placePlanHref("plan-search", "plan-1")).toEqual({
      pathname: "/plan-search/[planId]",
      params: { planId: "plan-1" },
    });
  });

  it("opens a plan on top of Weeks, in the app's own stack", () => {
    expect(placePlanHref("over", "plan-1")).toEqual({
      pathname: "/plan/[planId]",
      params: { planId: "plan-1" },
    });
  });

  it.each([
    ["plans", "/(tabs)/plans/daily-reminder"],
    ["plan-search", "/plan-search/daily-reminder"],
    ["over", "/daily-reminder"],
  ] as const)("opens a Settings page where the reader is: %s", (place, href) => {
    expect(placePageHref(place, "daily-reminder")).toBe(href);
  });

  it.each([
    ["progress", "/(tabs)/progress/privacy/[topic]"],
    ["plan-search", "/plan-search/privacy/[topic]"],
    ["over", "/privacy/[topic]"],
  ] as const)("opens a privacy topic where the reader is: %s", (place, pathname) => {
    expect(placePrivacyTopicHref(place, "keep")).toEqual({ pathname, params: { topic: "keep" } });
  });
});
