import { tabPageHref, tabPlanHref, tabPrivacyTopicHref, toAppTab } from "@/entities/tabs";

describe("toAppTab", () => {
  it.each(["home", "plans", "progress", "settings"] as const)("keeps the %s tab", (tab) => {
    expect(toAppTab(tab, "plans")).toBe(tab);
  });

  it("falls back where it's somewhere with no pages of its own (Fun, hidden)", () => {
    expect(toAppTab("fun", "plans")).toBe("plans");
  });

  it("falls back with no tab at all", () => {
    expect(toAppTab(null, "settings")).toBe("settings");
  });
});

describe("tab routes", () => {
  it("opens a plan in the tab it's opened from", () => {
    expect(tabPlanHref("progress", "plan-1")).toEqual({
      pathname: "/(tabs)/progress/[planId]",
      params: { planId: "plan-1" },
    });
  });

  it("opens a Settings page in the tab it's opened from", () => {
    expect(tabPageHref("plans", "daily-reminder")).toBe("/(tabs)/plans/daily-reminder");
  });

  it("opens a privacy topic in the tab it's opened from", () => {
    expect(tabPrivacyTopicHref("home", "keep")).toEqual({
      pathname: "/(tabs)/home/privacy/[topic]",
      params: { topic: "keep" },
    });
  });
});
