import {
  INITIAL_STATE,
  appReducer,
  getPlanById,
  getPlanDay,
  getPlanProgress,
  getQuestionResult,
  getQuizScore,
  isSaved,
  type AppAction,
  type AppState,
} from "@/core/store";

const state: AppState = INITIAL_STATE;
const ACTIVE = "plan-choose-whom-you-will-serve";
const READY = "plan-faith-through-the-storm";
const AT = "2026-09-23T07:00:00.000Z";
const TODAY = "2026-09-23";

function run(...actions: AppAction[]): AppState {
  return actions.reduce(appReducer, state);
}

const dayId = (planId: string, dayNumber: number) => getPlanDay(state, planId, dayNumber)?.id ?? "";

describe("appReducer", () => {
  it("leaves the state untouched for an unknown record", () => {
    expect(run({ type: "plan/archive", planId: "no-such-plan", at: AT })).toBe(state);
  });

  it("finishes a day, opens the next, and moves the plan's progress on", () => {
    const next = run({ type: "planDay/complete", dayId: dayId(ACTIVE, 2), today: TODAY, at: AT });

    expect(getPlanDay(next, ACTIVE, 2)?.status).toBe("completed");
    expect(getPlanDay(next, ACTIVE, 3)?.status).toBe("available");
    expect(getPlanProgress(next, ACTIVE)?.completedDayNumbers).toEqual([1, 2]);
  });

  it("won't finish a locked day", () => {
    expect(run({ type: "planDay/complete", dayId: dayId(ACTIVE, 4), today: TODAY, at: AT })).toBe(
      state,
    );
  });

  it("starts a ready plan when its first step is done", () => {
    const next = run({
      type: "planDay/completeStep",
      dayId: dayId(READY, 1),
      step: "read",
      today: TODAY,
      at: AT,
    });

    expect(getPlanById(next, READY)).toMatchObject({ status: "active", startDate: TODAY });
    expect(getPlanDay(next, READY, 1)).toMatchObject({
      status: "inProgress",
      completedSteps: ["read"],
    });
  });

  it("completes a plan when its last day is finished", () => {
    const next = run(
      ...[1, 2, 3].map((dayNumber): AppAction => ({
        type: "planDay/complete",
        dayId: dayId(READY, dayNumber),
        today: TODAY,
        at: AT,
      })),
    );

    expect(getPlanById(next, READY)).toMatchObject({ status: "completed", completedAt: AT });
  });

  it("records a quiz answer, replacing an earlier pick for the same question", () => {
    const attemptId = "attempt-new";
    const quizId = `${ACTIVE}-day-2-quiz`;
    const question = `${quizId}-q2`;
    const next = run(
      { type: "quiz/startAttempt", attemptId, quizId, at: AT },
      {
        type: "quiz/answer",
        answerId: "a1",
        attemptId,
        questionId: question,
        choiceId: `${question}-a`,
        at: AT,
      },
      {
        type: "quiz/answer",
        answerId: "a2",
        attemptId,
        questionId: question,
        choiceId: `${question}-b`,
        at: AT,
      },
    );

    expect(getQuestionResult(next, attemptId, question)).toBe("correct");
    expect(getQuizScore(next, attemptId)).toMatchObject({ correct: 1, answered: 1, total: 3 });
  });

  it("saves to and removes from the library", () => {
    const saved = run({
      type: "library/save",
      libraryItemId: "library-storm",
      kind: "plan",
      itemId: READY,
      note: null,
      at: AT,
    });
    const removed = appReducer(saved, { type: "library/remove", libraryItemId: "library-storm" });

    expect(isSaved(saved, "plan", READY)).toBe(true);
    expect(isSaved(removed, "plan", READY)).toBe(false);
  });

  it("updates settings without touching anything else", () => {
    const next = run({ type: "settings/update", changes: { textSize: "small" }, at: AT });

    expect(next.settings).toMatchObject({
      textSize: "small",
      bibleTranslation: "NIV",
      updatedAt: AT,
    });
    expect(next.plans).toBe(state.plans);
  });
});
