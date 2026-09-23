import { isPlanComplete, MOCK_PLANS, SAMPLE_PLAN_ID, getMockPlan } from "./mock-plans";

describe("isPlanComplete", () => {
  it("is false for a 1-day plan with no completed days", () => {
    expect(isPlanComplete({ totalDays: 1, completedDays: [] })).toBe(false);
  });

  it("is true for a 1-day plan once day 1 is complete", () => {
    expect(isPlanComplete({ totalDays: 1, completedDays: [1] })).toBe(true);
  });

  it("is false for a 3-day plan with only some days complete", () => {
    expect(isPlanComplete({ totalDays: 3, completedDays: [1, 2] })).toBe(false);
  });

  it("is true for a 3-day plan once all 3 days are complete", () => {
    expect(isPlanComplete({ totalDays: 3, completedDays: [1, 2, 3] })).toBe(true);
  });

  it("is false for a 7-day plan with 6 of 7 days complete", () => {
    expect(isPlanComplete({ totalDays: 7, completedDays: [1, 2, 3, 4, 5, 6] })).toBe(false);
  });

  it("is true for a 7-day plan once all 7 days are complete", () => {
    expect(isPlanComplete({ totalDays: 7, completedDays: [1, 2, 3, 4, 5, 6, 7] })).toBe(true);
  });

  it("does not require completedDays to be in order", () => {
    expect(isPlanComplete({ totalDays: 3, completedDays: [3, 1, 2] })).toBe(true);
  });

  it("ignores duplicate entries in completedDays", () => {
    expect(isPlanComplete({ totalDays: 2, completedDays: [1, 1, 1] })).toBe(false);
  });
});

describe("MOCK_PLANS", () => {
  it("includes at least one plan of each length used in manual testing: 1, 3, and 7 days", () => {
    const totalDaysSeen = MOCK_PLANS.map((plan) => plan.totalDays);

    expect(totalDaysSeen).toContain(1);
    expect(totalDaysSeen).toContain(3);
    expect(totalDaysSeen).toContain(7);
  });

  it("gives every mock plan a unique id", () => {
    const ids = MOCK_PLANS.map((plan) => plan.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getMockPlan", () => {
  it("returns the plan matching the given id", () => {
    const first = MOCK_PLANS[0];
    if (!first) throw new Error("MOCK_PLANS must not be empty");

    expect(getMockPlan(first.id)).toEqual(first);
  });

  it("returns the sample plan for SAMPLE_PLAN_ID", () => {
    expect(getMockPlan(SAMPLE_PLAN_ID)?.id).toBe(SAMPLE_PLAN_ID);
  });

  it("returns undefined for an id that does not exist", () => {
    expect(getMockPlan("does-not-exist")).toBeUndefined();
  });
});
