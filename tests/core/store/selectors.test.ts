import {
  INITIAL_STATE,
  getActivePlan,
  getCompletedPlans,
  getCurrentPlanDay,
  getInProgressPlans,
  getLibraryPlans,
  getPlanById,
  getPlanDay,
  getPlanDays,
  getPlanProgress,
  getProgressForDateRange,
  getProgressTotals,
  getQuestionResult,
  getQuizAttempt,
  getQuizForDay,
  getQuizScore,
  getReflectionsForDay,
  getScriptureForDay,
  getSermonForPlan,
  getStreak,
  getWeeklyCompletionCounts,
  isGeneratingPlan,
  type AppState,
} from "@/core/store";

// The store's own starting data: one active 6-day plan (day 1 done, day 2
// under way), a completed 7-day plan (30 Aug – 5 Sep), two ready plans (one
// saved), a draft, and one being built. "Today" is 2026-09-23.
const state: AppState = INITIAL_STATE;
const ACTIVE = "plan-choose-whom-you-will-serve";
const COMPLETED = "plan-give-thanks";
const SAVED = "plan-come-to-me-and-rest";
const TODAY = "2026-09-23";

describe("plan selectors", () => {
  it("finds the plan under way", () => {
    expect(getActivePlan(state)?.id).toBe(ACTIVE);
    expect(getInProgressPlans(state).map((plan) => plan.id)).toEqual([ACTIVE]);
  });

  it("lists finished plans and saved ones", () => {
    expect(getCompletedPlans(state).map((plan) => plan.id)).toEqual([COMPLETED]);
    expect(getLibraryPlans(state).map((plan) => plan.id)).toEqual([SAVED, COMPLETED]);
  });

  it("returns null for a plan that doesn't exist", () => {
    expect(getPlanById(state, "no-such-plan")).toBeNull();
  });

  it("lists a plan's days in order, and finds one by number", () => {
    expect(getPlanDays(state, ACTIVE).map((day) => day.dayNumber)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(getPlanDay(state, ACTIVE, 2)?.reading.title).toBe("Grace is received");
  });

  it("puts the user on the first day not yet finished", () => {
    expect(getCurrentPlanDay(state, ACTIVE)?.dayNumber).toBe(2);
  });

  it("stays on the last day once every day is finished", () => {
    expect(getCurrentPlanDay(state, COMPLETED)?.dayNumber).toBe(7);
  });

  it("finds a day's content and a plan's sermon", () => {
    const day = getPlanDay(state, ACTIVE, 2);

    expect(getScriptureForDay(state, day?.id ?? "")?.reference).toBe("Ephesians 2:8–9");
    expect(getReflectionsForDay(state, day?.id ?? "").map((r) => r.order)).toEqual([1, 2]);
    expect(getSermonForPlan(state, ACTIVE)?.title).toBe("Choose Whom You Will Serve");
  });
});

describe("getPlanProgress", () => {
  it("works out a plan under way from its days", () => {
    expect(getPlanProgress(state, ACTIVE)).toEqual({
      planId: ACTIVE,
      totalDays: 6,
      completedDayCount: 1,
      remainingDayCount: 5,
      completionPercentage: 17,
      completedDayNumbers: [1],
      currentDayNumber: 2,
    });
  });

  it("shows a finished plan at 100%", () => {
    expect(getPlanProgress(state, COMPLETED)?.completionPercentage).toBe(100);
  });

  it("shows a plan with no days yet at 0%, on day 1", () => {
    expect(getPlanProgress(state, "plan-salt-and-light")).toMatchObject({
      completedDayCount: 0,
      currentDayNumber: 1,
      completionPercentage: 0,
    });
  });
});

describe("quiz selectors", () => {
  const day1 = getPlanDay(state, ACTIVE, 1)?.id ?? "";
  const day2 = getPlanDay(state, ACTIVE, 2)?.id ?? "";
  const finished = getQuizAttempt(state, getQuizForDay(state, day1)?.id ?? "");
  const underway = getQuizAttempt(state, getQuizForDay(state, day2)?.id ?? "");

  it("scores a finished quiz from its answers", () => {
    expect(getQuizScore(state, finished?.id ?? "")).toEqual({
      correct: 1,
      answered: 2,
      total: 2,
      percentage: 50,
    });
  });

  it("tells right, wrong, and unanswered questions apart", () => {
    const quiz = getQuizForDay(state, day2)?.id ?? "";
    const results = ["q1", "q2"].map((q) =>
      getQuestionResult(state, underway?.id ?? "", `${quiz}-${q}`),
    );
    const wrong = getQuestionResult(state, finished?.id ?? "", `${finished?.quizId ?? ""}-q2`);

    expect(results).toEqual(["correct", "unanswered"]);
    expect(wrong).toBe("incorrect");
  });

  it("has no attempt for a quiz that hasn't been taken", () => {
    const savedDay = getPlanDay(state, SAVED, 1)?.id ?? "";

    expect(getQuizAttempt(state, getQuizForDay(state, savedDay)?.id ?? "")).toBeNull();
  });
});

describe("progress over time", () => {
  it("counts what was finished each day in a range", () => {
    expect(getProgressForDateRange(state, "2026-09-04", "2026-09-07")).toEqual([
      { date: "2026-09-04", weekday: "fri", completedDayCount: 1 },
      { date: "2026-09-05", weekday: "sat", completedDayCount: 1 },
      { date: "2026-09-06", weekday: "sun", completedDayCount: 0 },
      { date: "2026-09-07", weekday: "mon", completedDayCount: 0 },
    ]);
  });

  it("lays out today's week, Sunday to Saturday", () => {
    const week = getWeeklyCompletionCounts(state, TODAY);

    expect(week.map((day) => day.date)).toEqual([
      "2026-09-20",
      "2026-09-21",
      "2026-09-22",
      "2026-09-23",
      "2026-09-24",
      "2026-09-25",
      "2026-09-26",
    ]);
    expect(week.map((day) => day.completedDayCount)).toEqual([0, 0, 1, 0, 0, 0, 0]);
  });

  it("keeps the streak alive until today's study is done", () => {
    expect(getStreak(state, TODAY)).toEqual({ current: 1, longest: 7 });
  });

  it("ends the streak after a missed day", () => {
    expect(getStreak(state, "2026-09-25").current).toBe(0);
  });

  it("totals finished days and plans", () => {
    expect(getProgressTotals(state)).toEqual({ completedDayCount: 8, completedPlanCount: 1 });
  });
});

describe("isGeneratingPlan", () => {
  it("is true while a plan is being built", () => {
    expect(isGeneratingPlan(state)).toBe(true);
  });

  it("is false once the build has settled", () => {
    const generation = state.generation && { ...state.generation, status: "completed" as const };

    expect(isGeneratingPlan({ ...state, generation })).toBe(false);
  });
});
