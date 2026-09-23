import { MOCK_PLANS, SAMPLE_PLAN_ID, getMockPlan } from "@/features/plans/mock-plans";

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
