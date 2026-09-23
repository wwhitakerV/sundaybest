import {
  dayCompleteHref,
  planOverviewHref,
  quickCheckHref,
  studyHref,
} from "@/features/plans/logic/routes";

describe("plan routes", () => {
  it("builds the plan overview route", () => {
    expect(planOverviewHref("plan-a")).toEqual({
      pathname: "/(tabs)/plans/[planId]",
      params: { planId: "plan-a" },
    });
  });

  it("builds the study route with the day as a string", () => {
    expect(studyHref("plan-a", 2)).toEqual({
      pathname: "/study/[planId]",
      params: { planId: "plan-a", day: "2" },
    });
  });

  it("passes a day that is already a string through unchanged", () => {
    expect(dayCompleteHref("plan-a", "3").params.day).toBe("3");
  });

  it("builds the day-complete route", () => {
    expect(dayCompleteHref("plan-a", 1).pathname).toBe("/study/[planId]/day-complete");
  });

  it("builds the quick-check route", () => {
    expect(quickCheckHref("plan-a", 1)).toEqual({
      pathname: "/study/[planId]/quick-check",
      params: { planId: "plan-a", day: "1" },
    });
  });
});
