import {
  INITIAL_STATE,
  appReducer,
  getActivePlan,
  getCompletedPlans,
  getDayMinutes,
  getUserPlans,
  getCurrentPlanDay,
  getDayScripture,
  getInProgressPlans,
  getLatestQuizScore,
  getUpNext,
  getLibraryPlans,
  getPlanById,
  getPlanDay,
  getPlanDays,
  getPlanProgress,
  getPlanSummary,
  getProgressForDateRange,
  getProgressTotals,
  getQuickCheckStanding,
  getQuestionResult,
  getQuizAttempt,
  getQuizForDay,
  getQuizQuestions,
  getQuizScore,
  getQuizStatus,
  getReflectionsForDay,
  getScriptureForDay,
  getSermonForPlan,
  getStreak,
  getWeeklyCompletionCounts,
  isChoiceCorrect,
  isGeneratingPlan,
  type AppAction,
  type AppState,
} from "@/core/store";
import { SAMPLE_PLAN_ID } from "@/core/mock-data";
import { DRAFT_PLAN_ID, withDraftPlan, withPlanBeingBuilt } from "@tests/factories/pending-plans";
import { readyToComplete, withStepsDone } from "@tests/factories/store-days";

// The store's own starting data: one active 6-day plan (day 1 done, day 2
// under way), a completed 7-day plan (30 Aug – 5 Sep), two ready plans (one
// saved), a draft, and one being built. "Today" is 2026-09-23.
const state: AppState = INITIAL_STATE;
const ACTIVE = "plan-today-i-choose-to-be-a-blessing";
const COMPLETED = "plan-break-the-cycle-of-negative-thinking";
const SAVED = "plan-overcome-temptation";
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

  it("lists the user's built plans, not drafts, ones being built, or the untried sample", () => {
    const ids = getUserPlans(state).map((plan) => plan.id);

    expect(ids).toEqual(expect.arrayContaining([ACTIVE, COMPLETED, SAVED]));
    expect(ids).not.toContain(SAMPLE_PLAN_ID);
    expect(getUserPlans(withPlanBeingBuilt(withDraftPlan(state))).map((plan) => plan.id)).toEqual(
      ids,
    );
  });

  it("estimates a day's minutes from its content, with time to reflect and pray", () => {
    const minutes = getDayMinutes(state, getPlanDay(state, ACTIVE, 2)?.id ?? "");

    expect(minutes).toBeGreaterThanOrEqual(5);
    expect(getDayMinutes(state, "no-such-day")).toBe(0);
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
    expect(getSermonForPlan(state, ACTIVE)?.title).toBe("Today I Choose to Be a Blessing");
  });
});

describe("getDayScripture", () => {
  const dayId = getPlanDay(state, ACTIVE, 2)?.id ?? "";
  const reading = (translation: AppState["settings"]["bibleTranslation"]): AppState => ({
    ...state,
    settings: { ...state.settings, bibleTranslation: translation },
  });

  it("gives a day's passage in the user's translation", () => {
    const passage = getDayScripture(state, dayId);

    expect(passage?.translation).toBe("NIV");
    expect(passage?.verses.at(0)?.text).toMatch(/^For it is by grace you have been saved/);
  });

  it("switches to another translation the user picks, where the passage is there in it", () => {
    const passage = getDayScripture(reading("KJV"), dayId);

    expect(passage?.reference).toBe("Ephesians 2:8–9");
    expect(passage?.translation).toBe("KJV");
    expect(passage?.verses.at(0)?.text).toMatch(/^For by grace are ye saved through faith/);
  });

  it("keeps the passage as the plan was built when it isn't there in the user's translation", () => {
    expect(getDayScripture(reading("ESV"), dayId)?.translation).toBe("NIV");
  });

  it("finds nothing for a day that doesn't exist", () => {
    expect(getDayScripture(state, "no-such-day")).toBeNull();
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
    expect(getPlanProgress(withDraftPlan(state), DRAFT_PLAN_ID)).toMatchObject({
      completedDayCount: 0,
      currentDayNumber: 1,
      completionPercentage: 0,
    });
  });
});

describe("quiz selectors", () => {
  const day1 = getPlanDay(state, ACTIVE, 1)?.id ?? "";
  const day2 = getPlanDay(state, ACTIVE, 2)?.id ?? "";
  // Break the Cycle's day 6: its Quick Check left half-way.
  const halfway = getPlanDay(state, COMPLETED, 6)?.id ?? "";
  const finished = getQuizAttempt(state, getQuizForDay(state, day1)?.id ?? "");
  const underway = getQuizAttempt(state, getQuizForDay(state, halfway)?.id ?? "");

  it("scores a finished quiz from its answers", () => {
    expect(getQuizScore(state, finished?.id ?? "")).toEqual({
      correct: 1,
      answered: 2,
      total: 2,
      percentage: 50,
    });
  });

  it("tells right, wrong, and unanswered questions apart", () => {
    const quiz = getQuizForDay(state, halfway)?.id ?? "";
    const results = ["q1", "q2"].map((q) =>
      getQuestionResult(state, underway?.id ?? "", `${quiz}-${q}`),
    );
    const wrong = getQuestionResult(state, finished?.id ?? "", `${finished?.quizId ?? ""}-q2`);

    expect(results).toEqual(["correct", "unanswered"]);
    expect(wrong).toBe("incorrect");
  });

  it("counts each question once, however many answers a stray record gives it", () => {
    const attemptId = finished?.id ?? "";
    const firstQuestion = `${finished?.quizId ?? ""}-q1`;
    const duplicated: AppState = {
      ...state,
      quizAnswers: {
        ...state.quizAnswers,
        "stray-answer": {
          id: "stray-answer",
          createdAt: "2026-09-22T19:08:00.000Z",
          updatedAt: "2026-09-22T19:08:00.000Z",
          attemptId,
          questionId: firstQuestion,
          choiceId: `${firstQuestion}-b`,
          answeredAt: "2026-09-22T19:08:00.000Z",
        },
      },
    };

    expect(getQuizScore(duplicated, attemptId)).toEqual({
      correct: 1,
      answered: 2,
      total: 2,
      percentage: 50,
    });
  });

  it("says where a quiz stands: not started, under way, or done", () => {
    const savedDay = getPlanDay(state, SAVED, 1)?.id ?? "";
    const quizFor = (dayId: string) => getQuizForDay(state, dayId)?.id ?? "";

    expect(getQuizStatus(state, quizFor(savedDay))).toBe("notStarted");
    // A day not finished yet hasn't had its Quick Check.
    expect(getQuizStatus(state, quizFor(day2))).toBe("notStarted");
    expect(getQuizStatus(state, quizFor(halfway))).toBe("inProgress");
    expect(getQuizStatus(state, quizFor(day1))).toBe("completed");
  });

  it("has no attempt for a quiz that hasn't been taken", () => {
    const savedDay = getPlanDay(state, SAVED, 1)?.id ?? "";

    expect(getQuizAttempt(state, getQuizForDay(state, savedDay)?.id ?? "")).toBeNull();
  });
});

describe("getUpNext", () => {
  it("is the active plan's current day, today, when nothing's been finished today", () => {
    const next = getUpNext(state, TODAY);

    expect(next?.plan.id).toBe(ACTIVE);
    expect(next?.day.dayNumber).toBe(2);
    expect(next?.date).toBe(TODAY);
  });

  it("is tomorrow once a day has been finished today", () => {
    const done = appReducer(readyToComplete(state, ACTIVE, 2, TODAY, `${TODAY}T07:00:00.000Z`), {
      type: "planDay/complete",
      dayId: getPlanDay(state, ACTIVE, 2)?.id ?? "",
      today: TODAY,
      at: `${TODAY}T07:00:00.000Z`,
    });
    const next = getUpNext(done, TODAY);

    expect(next?.day.dayNumber).toBe(3);
    expect(next?.date).toBe("2026-09-24");
  });

  it("is nothing without a plan under way", () => {
    const none: AppState = { ...state, plans: {} };

    expect(getUpNext(none, TODAY)).toBeNull();
  });
});

describe("getLatestQuizScore", () => {
  it("scores the quiz finished most recently", () => {
    expect(getLatestQuizScore(state)).toMatchObject({ correct: 1, total: 2 });
  });

  it("is nothing before any quiz is finished", () => {
    expect(getLatestQuizScore({ ...state, quizAttempts: {} })).toBeNull();
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
  const building = withPlanBeingBuilt(state);

  it("is false with nothing being built", () => {
    expect(isGeneratingPlan(state)).toBe(false);
  });

  it("is true while a plan is being built", () => {
    expect(isGeneratingPlan(building)).toBe(true);
  });

  it("is false once the build has settled", () => {
    const generation = building.generation && {
      ...building.generation,
      status: "completed" as const,
    };

    expect(isGeneratingPlan({ ...building, generation })).toBe(false);
  });
});

describe("getQuickCheckStanding", () => {
  const savedDay = getPlanDay(state, SAVED, 1)?.id ?? "";
  const quiz = getQuizForDay(state, savedDay);
  const quizId = quiz?.id ?? "";

  it("is null for a day without a quiz", () => {
    expect(getQuickCheckStanding(state, "no-such-day")).toBeNull();
  });

  it("is not started, with nothing answered, before any attempt", () => {
    expect(getQuickCheckStanding(state, savedDay)).toEqual({
      status: "notStarted",
      questionCount: getQuizQuestions(state, quizId).length,
      answeredCount: 0,
      correctCount: 0,
    });
  });

  it("counts a submitted answer, and whether it was right", () => {
    const [first] = getQuizQuestions(state, quizId);
    const at = "2026-09-23T07:00:00.000Z";
    const answered = [
      { type: "quiz/startAttempt", quizId, attemptId: "attempt-new", at },
      {
        type: "quiz/selectAnswer",
        attemptId: "attempt-new",
        choiceId: first?.correctChoiceId ?? "",
        at,
      },
      { type: "quiz/submitAnswer", attemptId: "attempt-new", answerId: "answer-new", at },
    ].reduce(
      (current, action) => appReducer(current, action as AppAction),
      // A Quick Check opens once its day's steps are done.
      withStepsDone(state, SAVED, 1, TODAY, "2026-09-23T07:00:00.000Z"),
    );

    expect(getQuickCheckStanding(answered, savedDay)).toEqual({
      status: "inProgress",
      questionCount: getQuizQuestions(state, quizId).length,
      answeredCount: 1,
      correctCount: 1,
    });
  });
});

describe("getPlanSummary", () => {
  it("sums a finished plan: its days, written notes, and each quiz's latest attempt", () => {
    // 7 days done; 7 reflections answered; 7 quizzes of 3 questions; latest attempts
    // got 3 + 2 + 2 + 3 + 2 + 1 (day 6's is still open) + 3 right.
    expect(getPlanSummary(state, COMPLETED)).toEqual({
      completedDays: 7,
      totalDays: 7,
      notes: 7,
      quizCorrect: 16,
      quizTotal: 21,
    });
  });

  it("counts a plan under way as far as it has gone", () => {
    expect(getPlanSummary(state, ACTIVE)).toEqual({
      completedDays: 1,
      totalDays: 6,
      notes: 2,
      quizCorrect: 1,
      quizTotal: 17,
    });
  });

  it("counts no quiz right for a quiz not yet taken", () => {
    expect(getPlanSummary(state, SAVED)).toEqual({
      completedDays: 0,
      totalDays: 1,
      notes: 0,
      quizCorrect: 0,
      quizTotal: 2,
    });
  });

  it("has no quizzes to count for a plan without any", () => {
    expect(getPlanSummary(state, "plan-still-praying")).toEqual({
      completedDays: 0,
      totalDays: 3,
      notes: 0,
      quizCorrect: 0,
      quizTotal: 0,
    });
  });

  it("is null for an unknown plan", () => {
    expect(getPlanSummary(state, "plan-nope")).toBeNull();
  });
});

describe("isChoiceCorrect", () => {
  const quizId =
    getQuizForDay(state, getPlanDay(state, "plan-overcome-temptation", 1)?.id ?? "")?.id ?? "";
  const [question] = getQuizQuestions(state, quizId);
  const wrongChoice = question?.choices.find((choice) => choice.id !== question.correctChoiceId);

  it("is true for a question's correct choice", () => {
    expect(isChoiceCorrect(state, question?.id ?? "", question?.correctChoiceId ?? "")).toBe(true);
  });

  it("is false for another choice of the same question", () => {
    expect(wrongChoice).toBeDefined();
    expect(isChoiceCorrect(state, question?.id ?? "", wrongChoice?.id ?? "")).toBe(false);
  });

  it("is false for a question that doesn't exist", () => {
    expect(isChoiceCorrect(state, "no-such-question", "no-such-choice")).toBe(false);
  });
});
