import {
  getNextDayAfterCompleting,
  getNextIncompleteDay,
} from "@/features/plans/logic/plan-progress";

describe("getNextIncompleteDay", () => {
  it("returns day 1 for a 1-day plan with no completed days", () => {
    expect(getNextIncompleteDay(1, [])).toBe(1);
  });

  it("returns undefined for a 1-day plan once day 1 is complete", () => {
    expect(getNextIncompleteDay(1, [1])).toBeUndefined();
  });

  it("returns the first gap for a 3-day plan with only some days complete", () => {
    expect(getNextIncompleteDay(3, [1, 2])).toBe(3);
  });

  it("returns undefined for a 3-day plan once all 3 days are complete", () => {
    expect(getNextIncompleteDay(3, [1, 2, 3])).toBeUndefined();
  });

  it("returns day 7 for a 7-day plan with 6 of 7 days complete", () => {
    expect(getNextIncompleteDay(7, [1, 2, 3, 4, 5, 6])).toBe(7);
  });

  it("returns undefined for a 7-day plan once all 7 days are complete", () => {
    expect(getNextIncompleteDay(7, [1, 2, 3, 4, 5, 6, 7])).toBeUndefined();
  });

  it("does not require completedDays to be in order", () => {
    expect(getNextIncompleteDay(3, [3, 1, 2])).toBeUndefined();
  });

  it("ignores duplicate entries in completedDays", () => {
    expect(getNextIncompleteDay(2, [1, 1, 1])).toBe(2);
  });

  it("returns the lowest gap, not the day after the highest completed day", () => {
    expect(getNextIncompleteDay(4, [1, 3])).toBe(2);
  });
});

describe("getNextDayAfterCompleting", () => {
  it("offers the next incomplete day once the finished day is folded in", () => {
    expect(getNextDayAfterCompleting({ totalDays: 3, completedDays: [1] }, 2)).toBe(3);
  });

  it("returns undefined when the finished day completes the plan", () => {
    expect(getNextDayAfterCompleting({ totalDays: 3, completedDays: [1, 2] }, 3)).toBeUndefined();
  });

  it("does not mutate the plan's completed days", () => {
    const completedDays = [1];
    getNextDayAfterCompleting({ totalDays: 3, completedDays }, 2);

    expect(completedDays).toEqual([1]);
  });
});
