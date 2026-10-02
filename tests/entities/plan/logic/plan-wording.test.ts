import { formatDay, formatDayOfTotal, formatPlanLength } from "@/entities/plan/logic/plan-wording";

describe("plan wording", () => {
  it("names a day", () => {
    expect(formatDay(2)).toBe("Day 2");
  });

  it("names a day out of the plan's total", () => {
    expect(formatDayOfTotal(2, 6)).toBe("Day 2 of 6");
  });

  it("says '1 day' for a one-day plan", () => {
    expect(formatPlanLength(1)).toBe("1 day");
  });

  it("pluralises a longer plan's length", () => {
    expect(formatPlanLength(3)).toBe("3 days");
  });
});
