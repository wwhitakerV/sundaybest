import { describeEmptyLibrary, getPlanFilterOptions } from "@/features/plans/logic/plan-filters";

describe("getPlanFilterOptions", () => {
  it("labels each filter with its count, in order", () => {
    expect(getPlanFilterOptions({ inProgress: 1, done: 2 })).toEqual([
      { label: "In progress", count: 1 },
      { label: "Done", count: 2 },
    ]);
  });

  it("gives zero counts for no plans", () => {
    expect(getPlanFilterOptions({ inProgress: 0, done: 0 }).map(({ count }) => count)).toEqual([
      0, 0,
    ]);
  });
});

describe("describeEmptyLibrary", () => {
  it.each([
    [
      "In progress" as const,
      { title: "Nothing in progress", message: "Start a plan and it will show here." },
    ],
    [
      "Done" as const,
      { title: "No finished plans yet", message: "Plans you finish will show here." },
    ],
  ])("words %s with nothing in it", (filter, words) => {
    expect(describeEmptyLibrary(filter)).toEqual(words);
  });

  it("words a library with no plans at all, when no filter is picked", () => {
    expect(describeEmptyLibrary(null)).toEqual({
      title: "No plans yet",
      message: "Add a sermon and your first plan will show here.",
    });
  });
});
