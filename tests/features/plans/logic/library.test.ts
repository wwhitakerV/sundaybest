import type { Plan } from "@/types/domain";

import { describeLibraryPlan } from "@/features/plans/logic/library";

function plan(changes: Partial<Plan>): Plan {
  return {
    id: "plan-1",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    userId: "user-1",
    sermonId: "sermon-1",
    title: "A plan",
    status: "ready",
    lengthDays: 3,
    quickCheckEnabled: true,
    startDate: null,
    startedAt: null,
    completedAt: null,
    archivedAt: null,
    isSample: false,
    ...changes,
  };
}

describe("describeLibraryPlan", () => {
  it("shows a plan under way as in progress, on its current day", () => {
    expect(
      describeLibraryPlan(plan({ status: "active", lengthDays: 6 }), { currentDayNumber: 2 }),
    ).toEqual({
      status: "In progress",
      detail: "Day 2 of 6",
      summary: "In progress · Day 2 of 6",
    });
  });

  it("shows a finished plan as done, with when", () => {
    expect(
      describeLibraryPlan(plan({ status: "completed", completedAt: "2026-09-05T07:05:00.000Z" }), {
        currentDayNumber: 3,
      }),
    ).toEqual({
      status: "Done",
      detail: "Finished Sep 5",
      summary: "Done · Finished Sep 5",
    });
  });

  it("shows a plan not started with its length", () => {
    expect(
      describeLibraryPlan(plan({ status: "ready", lengthDays: 1 }), { currentDayNumber: 1 }),
    ).toEqual({
      status: "Not started",
      detail: "1 day",
      summary: "Not started · 1 day",
    });
  });
});
