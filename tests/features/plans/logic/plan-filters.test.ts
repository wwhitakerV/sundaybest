import { INITIAL_STATE } from "@/core/store";
import {
  describeEmptyFilter,
  getPlanFilterOptions,
  getPlansForFilter,
} from "@/features/plans/logic/plan-filters";

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
    expect(ids("In progress")).toEqual(["plan-today-i-choose-to-be-a-blessing"]);
    expect(ids("Done")).toEqual(["plan-break-the-cycle-of-negative-thinking"]);
    expect(ids("Saved")).toEqual([
      "plan-overcome-temptation",
      "plan-break-the-cycle-of-negative-thinking",
    ]);
    expect(ids("All")).toHaveLength(4);
  });

  it("shows every plan for a filter it doesn't know", () => {
    expect(ids("Something else")).toEqual(ids("All"));
  });
});

describe("describeEmptyFilter", () => {
  const ALL = {
    title: "No plans yet",
    message: "Add a sermon and your first plan will show here.",
  };

  it.each([
    ["All", ALL],
    [
      "In progress",
      { title: "Nothing in progress", message: "Start a plan and it will show here." },
    ],
    ["Done", { title: "No finished plans yet", message: "Plans you finish will show here." }],
    [
      "Saved",
      {
        title: "Nothing saved yet",
        message: "Save a plan from its More menu to keep it here.",
      },
    ],
  ])("words %s", (filter, words) => {
    expect(describeEmptyFilter(filter)).toEqual(words);
  });

  it("falls back to the All words for a filter it doesn't know", () => {
    expect(describeEmptyFilter("Something else")).toEqual(ALL);
  });
});
