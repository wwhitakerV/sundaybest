import { describePlanHero } from "@/features/plans/logic/plan-hero";

const DAY = { dayTitle: "Grace is received", minutes: 9 };

describe("describePlanHero", () => {
  it("frames a plan under way by the day it's on", () => {
    expect(describePlanHero({ status: "active", currentDay: 2, totalDays: 6, ...DAY })).toEqual({
      status: "IN PROGRESS · DAY 2 OF 6",
      action: "Continue Day 2",
      today: "Today: Grace is received · 9 min",
    });
  });

  it("frames one not started by its length, and starts it on day 1", () => {
    expect(describePlanHero({ status: "ready", currentDay: 1, totalDays: 3, ...DAY })).toEqual({
      status: "NOT STARTED · 3 DAYS",
      action: "Start Day 1",
      today: "Day 1: Grace is received · 9 min",
    });
  });

  it("frames a finished one as done, to review its last day", () => {
    expect(describePlanHero({ status: "completed", currentDay: 7, totalDays: 7, ...DAY })).toEqual({
      status: "COMPLETED · 7 DAYS",
      action: "Review Day 7",
      today: "Day 7: Grace is received · 9 min",
    });
  });

  it("says one day, not one days", () => {
    expect(describePlanHero({ status: "ready", currentDay: 1, totalDays: 1, ...DAY }).status).toBe(
      "NOT STARTED · 1 DAY",
    );
  });
});
