import { INITIAL_STATE } from "@/core/store";
import { getPlanFilterOptions, getPlansForFilter } from "@/features/plans/logic/plan-filters";

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

describe("getPlansForFilter", () => {
  const ids = (filter: string) => getPlansForFilter(INITIAL_STATE, filter).map((plan) => plan.id);

  it("reads each filter's plans from the store", () => {
    expect(ids("In progress")).toEqual(["plan-choose-whom-you-will-serve"]);
    expect(ids("Done")).toEqual(["plan-give-thanks"]);
    expect(ids("Saved")).toEqual(["plan-come-to-me-and-rest", "plan-give-thanks"]);
    expect(ids("All")).toHaveLength(4);
  });

  it("shows every plan for a filter it doesn't know", () => {
    expect(ids("Something else")).toEqual(ids("All"));
  });
});
