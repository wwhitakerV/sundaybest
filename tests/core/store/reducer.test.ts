import {
  INITIAL_STATE,
  appReducer,
  getLibraryPlans,
  getPlanById,
  getPlanDay,
  getPlanProgress,
  getProgressTotals,
  getQuestionResult,
  getQuizAttempt,
  getQuizScore,
  isGeneratingPlan,
  type AppAction,
  type AppState,
  type GeneratedPlanContent,
} from "@/core/store";

// Starting data: an active 6-day plan (day 1 done, day 2 under way, its quiz
// on question 2), a completed 7-day plan, a ready 3-day plan, a saved 1-day
// plan, a draft, and a plan being built.
const state: AppState = INITIAL_STATE;
const ACTIVE = "plan-choose-whom-you-will-serve";
const COMPLETED = "plan-give-thanks";
const READY = "plan-faith-through-the-storm";
const DRAFT = "plan-salt-and-light";
const BUILDING = "plan-who-is-my-neighbor";
const AT = "2026-09-23T07:00:00.000Z";
const TODAY = "2026-09-23";

const run = (...actions: AppAction[]): AppState => actions.reduce(appReducer, state);
/** A record by ID, from one of the state's tables. */
const find = <T extends { id: string }>(table: Record<string, T>, id: string): T | undefined =>
  Object.values(table).find((record) => record.id === id);
const dayId = (planId: string, dayNumber: number) => getPlanDay(state, planId, dayNumber)?.id ?? "";
const completeDay = (planId: string, dayNumber: number): AppAction => ({
  type: "planDay/complete",
  dayId: dayId(planId, dayNumber),
  today: TODAY,
  at: AT,
});

describe("plans", () => {
  it("creates a draft plan and a placeholder sermon from a link", () => {
    const next = run({
      type: "plan/create",
      planId: "plan-new",
      sermonId: "sermon-new",
      sourceUrl: " https://youtu.be/abc123 ",
      title: "A new sermon",
      lengthDays: 4,
      quickCheckEnabled: false,
      at: AT,
    });

    expect(getPlanById(next, "plan-new")).toMatchObject({ status: "draft", lengthDays: 4 });
    expect(find(next.sermons, "sermon-new")).toMatchObject({
      url: "https://youtu.be/abc123",
      platform: "youtube",
      transcriptStatus: "processing",
    });
  });

  it("won't create a plan without a link, or over an existing one", () => {
    const create = (planId: string, sourceUrl: string): AppAction => ({
      type: "plan/create",
      planId,
      sermonId: "sermon-new",
      sourceUrl,
      title: "A new sermon",
      lengthDays: 3,
      quickCheckEnabled: true,
      at: AT,
    });

    expect(run(create("plan-new", "  "))).toBe(state);
    expect(run(create(ACTIVE, "https://youtu.be/x"))).toBe(state);
  });

  it("changes a draft's length, but not a built plan's", () => {
    const change = (planId: string): AppAction => ({
      type: "plan/update",
      planId,
      changes: { lengthDays: 2 },
      at: AT,
    });

    expect(getPlanById(run(change(DRAFT)), DRAFT)?.lengthDays).toBe(2);
    expect(run(change(ACTIVE))).toBe(state);
  });

  it("starts a ready plan", () => {
    const next = run({ type: "plan/start", planId: READY, today: TODAY, at: AT });

    expect(getPlanById(next, READY)).toMatchObject({ status: "active", startDate: TODAY });
  });

  it("won't complete a plan with days still to do", () => {
    expect(run({ type: "plan/complete", planId: ACTIVE, at: AT })).toBe(state);
  });

  it("never takes a completed plan back to being built", () => {
    expect(run({ type: "generation/start", generationId: "g", planId: COMPLETED, at: AT })).toBe(
      state,
    );
  });

  it("archives a plan, but not one being built", () => {
    expect(getPlanById(run({ type: "plan/archive", planId: READY, at: AT }), READY)?.status).toBe(
      "archived",
    );
    expect(run({ type: "plan/archive", planId: BUILDING, at: AT })).toBe(state);
  });

  it("saves a plan once, and removes it", () => {
    const save: AppAction = { type: "plan/save", planId: READY, libraryItemId: "lib-1", at: AT };
    const saved = run(save);
    const savedTwice = appReducer(saved, { ...save, libraryItemId: "lib-2" });
    const removed = appReducer(saved, { type: "plan/removeSaved", planId: READY });

    expect(getLibraryPlans(saved).map((plan) => plan.id)).toContain(READY);
    expect(savedTwice).toBe(saved);
    expect(getLibraryPlans(removed).map((plan) => plan.id)).not.toContain(READY);
  });

  it("won't save a draft", () => {
    expect(run({ type: "plan/save", planId: DRAFT, libraryItemId: "lib-1", at: AT })).toBe(state);
  });
});

describe("plan days", () => {
  it("finishes a day, opens the next, and moves progress on", () => {
    const next = run(completeDay(ACTIVE, 2));

    expect(getPlanDay(next, ACTIVE, 2)?.status).toBe("completed");
    expect(getPlanDay(next, ACTIVE, 3)?.status).toBe("available");
    expect(getPlanProgress(next, ACTIVE)?.completedDayNumbers).toEqual([1, 2]);
  });

  it("won't complete a locked day directly", () => {
    expect(run(completeDay(ACTIVE, 4))).toBe(state);
  });

  it("completes a day only once, however often it's recorded", () => {
    const once = run(completeDay(ACTIVE, 2));
    const again = appReducer(once, completeDay(ACTIVE, 2));
    const recorded = appReducer(again, {
      type: "progress/recordDayCompletion",
      dayId: dayId(ACTIVE, 2),
      today: TODAY,
      at: "2026-09-23T09:00:00.000Z",
    });

    expect(recorded).toBe(once);
    expect(getProgressTotals(recorded).completedDayCount).toBe(
      getProgressTotals(state).completedDayCount + 1,
    );
  });

  it("marks a step done, starting a ready plan, and counts each step once", () => {
    const step: AppAction = {
      type: "planDay/update",
      dayId: dayId(READY, 1),
      completedStep: "read",
      today: TODAY,
      at: AT,
    };
    const next = run(step);

    expect(getPlanById(next, READY)?.status).toBe("active");
    expect(getPlanDay(next, READY, 1)).toMatchObject({
      status: "inProgress",
      completedSteps: ["read"],
    });
    expect(appReducer(next, step)).toBe(next);
  });

  it("completes the plan when its last day is done", () => {
    const next = run(completeDay(READY, 1), completeDay(READY, 2), completeDay(READY, 3));

    expect(getPlanById(next, READY)).toMatchObject({ status: "completed", completedAt: AT });
  });
});

describe("reflections", () => {
  const second = `${dayId(ACTIVE, 2)}-reflection-2`;
  const first = `${dayId(ACTIVE, 2)}-reflection-1`;

  it("saves a first answer, trimmed", () => {
    const next = run({
      type: "reflection/save",
      reflectionId: second,
      answer: " In a friend. ",
      at: AT,
    });

    expect(find(next.reflections, second)).toMatchObject({
      answer: "In a friend.",
      answeredAt: AT,
    });
  });

  it("won't save over an answer, or save an empty one", () => {
    expect(run({ type: "reflection/save", reflectionId: first, answer: "Again", at: AT })).toBe(
      state,
    );
    expect(run({ type: "reflection/save", reflectionId: second, answer: "  ", at: AT })).toBe(
      state,
    );
  });

  it("updates an answer already given", () => {
    const next = run({
      type: "reflection/update",
      reflectionId: first,
      answer: "My evenings.",
      at: AT,
    });

    expect(find(next.reflections, first)?.answer).toBe("My evenings.");
  });

  it("clears an answer the user has emptied, back to unanswered", () => {
    const next = run({ type: "reflection/clear", reflectionId: first, at: AT });

    expect(find(next.reflections, first)).toMatchObject({ answer: null, answeredAt: null });
  });

  it("has nothing to clear on a question not answered", () => {
    expect(run({ type: "reflection/clear", reflectionId: second, at: AT })).toBe(state);
  });

  it("can answer a question again once it's been cleared", () => {
    const cleared = run({ type: "reflection/clear", reflectionId: first, at: AT });
    const next = appReducer(cleared, {
      type: "reflection/save",
      reflectionId: first,
      answer: "Something else.",
      at: AT,
    });

    expect(find(next.reflections, first)?.answer).toBe("Something else.");
  });

  it("won't answer a locked day's reflection", () => {
    const locked = `${dayId(ACTIVE, 4)}-reflection-1`;

    expect(run({ type: "reflection/save", reflectionId: locked, answer: "Too soon", at: AT })).toBe(
      state,
    );
  });
});

describe("quizzes", () => {
  const quizId = `${ACTIVE}-day-2-quiz`;
  const open = getQuizAttempt(state, quizId)?.id ?? "";
  const q2 = `${quizId}-q2`;
  const q3 = `${quizId}-q3`;
  const submit = (answerId: string): AppAction => ({
    type: "quiz/submitAnswer",
    attemptId: open,
    answerId,
    at: AT,
  });
  const select = (choiceId: string): AppAction => ({
    type: "quiz/selectAnswer",
    attemptId: open,
    choiceId,
    at: AT,
  });
  const next: AppAction = { type: "quiz/nextQuestion", attemptId: open, at: AT };
  const complete: AppAction = { type: "quiz/completeAttempt", attemptId: open, at: AT };

  it("won't start a second attempt while one is under way", () => {
    expect(run({ type: "quiz/startAttempt", quizId, attemptId: "attempt-2", at: AT })).toBe(state);
  });

  it("submits the picked choice as the answer, and records it once", () => {
    const answered = run(submit("answer-1"));

    expect(getQuestionResult(answered, open, q2)).toBe("incorrect");
    expect(appReducer(answered, submit("answer-2"))).toBe(answered);
  });

  it("won't pick a choice from another question", () => {
    expect(run(select(`${q3}-a`))).toBe(state);
  });

  it("moves on only once the current question is answered", () => {
    expect(run(next)).toBe(state);
    expect(find(run(submit("answer-1"), next).quizAttempts, open)?.currentQuestionId).toBe(q3);
  });

  it("completes an attempt only with every question answered, and only once", () => {
    const finished = run(submit("answer-1"), next, select(`${q3}-b`), submit("answer-2"), complete);

    expect(run(complete)).toBe(state);
    expect(find(finished.quizAttempts, open)).toMatchObject({
      status: "completed",
      completedAt: AT,
    });
    expect(getQuizScore(finished, open)).toMatchObject({ correct: 2, total: 3, percentage: 67 });
    expect(
      appReducer(finished, { type: "progress/recordQuizCompletion", attemptId: open, at: AT }),
    ).toBe(finished);
  });

  it("won't complete an attempt that doesn't exist", () => {
    expect(run({ type: "quiz/completeAttempt", attemptId: "no-such-attempt", at: AT })).toBe(state);
  });
});

describe("settings", () => {
  it("changes the translation and text size", () => {
    const next = run(
      { type: "settings/bibleTranslation", translation: "ESV", at: AT },
      { type: "settings/textSize", textSize: "small", at: AT },
    );

    expect(next.settings).toMatchObject({ bibleTranslation: "ESV", textSize: "small" });
  });

  it("turns a reminder on and sets its time — a real time only", () => {
    const next = run(
      {
        type: "settings/reminderEnabled",
        reminderId: "reminder-quick-check",
        enabled: true,
        at: AT,
      },
      { type: "settings/reminderTime", reminderId: "reminder-quick-check", time: "20:15", at: AT },
    );

    expect(find(next.reminders, "reminder-quick-check")).toMatchObject({
      enabled: true,
      time: "20:15",
    });
    expect(
      run({
        type: "settings/reminderTime",
        reminderId: "reminder-quick-check",
        time: "25:00",
        at: AT,
      }),
    ).toBe(state);
  });
});

describe("plan generation", () => {
  const template = getPlanDay(state, READY, 1);
  if (!template) throw new Error("The mock data's ready plan has a first day.");
  const content = (lengthDays: number): GeneratedPlanContent => ({
    title: "Who Is My Neighbor?",
    sermon: {
      title: "Who Is My Neighbor?",
      speaker: "Elena Brooks",
      church: "Harbor Light Church",
      thumbnailUrl: null,
      durationSeconds: 2_233,
      publishedOn: "2026-09-20",
      transcriptStatus: "available",
      transcript: [],
    },
    days: Array.from({ length: lengthDays }, (_, index) => ({
      ...template,
      id: `${BUILDING}-day-${index + 1}`,
      planId: BUILDING,
      dayNumber: index + 1,
    })),
    scripture: [],
    reflections: [],
    prayers: [],
    quizzes: [],
    quizQuestions: [],
  });

  it("moves forward through its stages, never back", () => {
    const forward = run({ type: "generation/step", status: "buildingQuiz", at: AT });

    expect(forward.generation?.status).toBe("buildingQuiz");
    expect(appReducer(forward, { type: "generation/step", status: "preparing", at: AT })).toBe(
      forward,
    );
  });

  it("completes into a ready plan, first day open, the rest locked", () => {
    const next = run({ type: "generation/complete", content: content(4), at: AT });

    expect(getPlanById(next, BUILDING)?.status).toBe("ready");
    expect(isGeneratingPlan(next)).toBe(false);
    expect([1, 2].map((n) => getPlanDay(next, BUILDING, n)?.status)).toEqual([
      "available",
      "locked",
    ]);
  });

  it("refuses content that doesn't fit the plan", () => {
    expect(run({ type: "generation/complete", content: content(3), at: AT })).toBe(state);
  });

  it("fails back to a draft, and retries from there", () => {
    const failed = run({
      type: "generation/fail",
      error: { code: "noCaptions", message: "This video has no captions." },
      at: AT,
    });
    const retried = appReducer(failed, { type: "generation/retry", at: AT });

    expect(getPlanById(failed, BUILDING)?.status).toBe("draft");
    expect(failed.generation?.status).toBe("failed");
    expect(retried.generation).toMatchObject({ status: "validating", attempt: 2, error: null });
    expect(getPlanById(retried, BUILDING)?.status).toBe("generating");
  });

  it("won't start a second build while one is under way", () => {
    expect(run({ type: "generation/start", generationId: "g", planId: DRAFT, at: AT })).toBe(state);
  });
});
