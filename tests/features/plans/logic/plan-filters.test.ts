import { getPlanFilterOptions } from "@/features/plans/logic/plan-filters";

describe("getPlanFilterOptions", () => {
  it("labels each filter with its count, in order", () => {
    expect(getPlanFilterOptions({ all: 4, inProgress: 1, done: 1, saved: 2 })).toEqual([
      { label: "All", count: 4 },
      { label: "In progress", count: 1 },
      { label: "Done", count: 1 },
      { label: "Saved", count: 2 },
    ]);
  });

  it("gives zero counts for no plans", () => {
    expect(
      getPlanFilterOptions({ all: 0, inProgress: 0, done: 0, saved: 0 }).map(
        (option) => option.count,
      ),
    ).toEqual([0, 0, 0, 0]);
  });
});
