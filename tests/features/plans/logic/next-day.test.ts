import { getNextDayToStudy } from "@/features/plans/logic/next-day";

describe("getNextDayToStudy", () => {
  it("offers the day the plan is on now, once the day before it is done", () => {
    expect(getNextDayToStudy({ remainingDayCount: 2, currentDayNumber: 2 }, 1)).toBe(2);
  });

  it("offers nothing once the plan is finished", () => {
    expect(getNextDayToStudy({ remainingDayCount: 0, currentDayNumber: 3 }, 3)).toBeUndefined();
  });

  it("offers nothing while the finished day is still the one the plan is on", () => {
    expect(getNextDayToStudy({ remainingDayCount: 3, currentDayNumber: 1 }, 1)).toBeUndefined();
  });
});
