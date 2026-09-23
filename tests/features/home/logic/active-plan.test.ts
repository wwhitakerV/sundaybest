import { getActivePlan } from "@/features/home/logic/active-plan";
import type { Plan } from "@/features/plans";

function plan(id: string, completed: boolean): Plan {
  return { id, title: id, totalDays: 3, currentDay: 1, completedDays: [], completed };
}

describe("getActivePlan", () => {
  it("returns the first incomplete plan", () => {
    expect(getActivePlan([plan("done", true), plan("a", false), plan("b", false)])?.id).toBe("a");
  });

  it("returns undefined when every plan is complete", () => {
    expect(getActivePlan([plan("done", true)])).toBeUndefined();
  });

  it("returns undefined when forced to the no-active-plan state", () => {
    expect(getActivePlan([plan("a", false)], false)).toBeUndefined();
  });

  it("still needs an incomplete plan when forced to the active state", () => {
    expect(getActivePlan([plan("done", true)], true)).toBeUndefined();
  });
});
