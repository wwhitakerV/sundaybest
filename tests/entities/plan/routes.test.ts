import {
  HOME_HREF,
  NEW_PLAN_HREF,
  dayCompleteHref,
  parsePlanParams,
  parseStudyParams,
  planOverviewHref,
  quickCheckHref,
  studyHref,
} from "@/entities/plan/routes";

describe("plan routes", () => {
  it("leads to the Home tab, and to New Plan's first step", () => {
    expect(HOME_HREF).toBe("/(tabs)/home");
    expect(NEW_PLAN_HREF).toBe("/(plan-creation)/paste-sermon");
  });

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

describe("parsePlanParams", () => {
  it("refuses a planId longer than any plan's ID could be", () => {
    expect(parsePlanParams({ planId: "p".repeat(65) })).toBeNull();
    expect(parsePlanParams({ planId: "p".repeat(64) })).toEqual({ planId: "p".repeat(64) });
  });

  it("returns the planId from a params object", () => {
    expect(parsePlanParams({ planId: "plan-a" })).toEqual({ planId: "plan-a" });
  });

  it("allows extra keys and drops them from the result", () => {
    expect(parsePlanParams({ planId: "plan-a", day: "2" })).toEqual({ planId: "plan-a" });
  });

  it.each([
    ["missing", {}],
    ["empty", { planId: "" }],
    ["an array", { planId: ["plan-a"] }],
    ["a number", { planId: 4 }],
    ["undefined", undefined],
    ["null", null],
    ["a string", "plan-a"],
  ])("is null when planId is %s", (_name, params) => {
    expect(parsePlanParams(params)).toBeNull();
  });
});

describe("parseStudyParams", () => {
  it("refuses a day of more than three digits — no plan runs that long", () => {
    expect(parseStudyParams({ planId: "plan-1", day: "1000" })).toBeNull();
    expect(parseStudyParams({ planId: "plan-1", day: "99999999999999999999" })).toBeNull();
    expect(parseStudyParams({ planId: "plan-1", day: "999" })).toEqual({
      planId: "plan-1",
      dayNumber: 999,
    });
  });

  it("returns the planId and the day as a number", () => {
    expect(parseStudyParams({ planId: "plan-a", day: "2" })).toEqual({
      planId: "plan-a",
      dayNumber: 2,
    });
  });

  it("accepts a multi-digit day", () => {
    expect(parseStudyParams({ planId: "plan-a", day: "14" })?.dayNumber).toBe(14);
  });

  it.each(["0", "-1", "1.5", "abc", ""])("is null for the day %j", (day) => {
    expect(parseStudyParams({ planId: "plan-a", day })).toBeNull();
  });

  it("is null when the day is missing", () => {
    expect(parseStudyParams({ planId: "plan-a" })).toBeNull();
  });

  it("is null when the day is an array", () => {
    expect(parseStudyParams({ planId: "plan-a", day: ["2"] })).toBeNull();
  });

  it("is null when the planId is missing or empty", () => {
    expect(parseStudyParams({ day: "2" })).toBeNull();
    expect(parseStudyParams({ planId: "", day: "2" })).toBeNull();
  });

  it("is null when params is not an object", () => {
    expect(parseStudyParams(null)).toBeNull();
  });
});
