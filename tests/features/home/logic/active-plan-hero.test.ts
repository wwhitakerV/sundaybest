import { describeActivePlan } from "@/features/home/logic/active-plan-hero";

describe("describeActivePlan", () => {
  const plan = describeActivePlan({
    currentDay: 2,
    totalDays: 6,
    dayTitle: "Grace is received",
    minutes: 9,
  });

  it("says where the plan stands, in capitals", () => {
    expect(plan.status).toBe("IN PROGRESS · DAY 2 OF 6");
  });

  it("offers to continue with the day it's on", () => {
    expect(plan.action).toBe("Continue Day 2");
  });

  it("says what today's study is, and about how long it takes", () => {
    expect(plan.today).toBe("Today: Grace is received · 9 min");
  });

  it("names just the day for the plan bar", () => {
    expect(plan.day).toBe("Day 2");
  });
});
