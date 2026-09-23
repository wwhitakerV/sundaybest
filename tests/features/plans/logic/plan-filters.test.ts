import { getPlanFilterOptions } from "@/features/plans/logic/plan-filters";
import type { Plan } from "@/features/plans/types";

function plan(id: string, completed: boolean): Plan {
  return { id, title: id, totalDays: 3, currentDay: 1, completedDays: [], completed };
}

describe("getPlanFilterOptions", () => {
  it("counts all, in-progress, and done plans, with Saved always empty for now", () => {
    const options = getPlanFilterOptions([plan("a", false), plan("b", true), plan("c", false)]);

    expect(options).toEqual([
      { label: "All", count: 3 },
      { label: "In progress", count: 2 },
      { label: "Done", count: 1 },
      { label: "Saved", count: 0 },
    ]);
  });

  it("gives zero counts for no plans", () => {
    expect(getPlanFilterOptions([]).map((option) => option.count)).toEqual([0, 0, 0, 0]);
  });
});
