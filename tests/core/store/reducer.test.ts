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
  type ReflectionWrite,
} from "@/core/store";
import {
  BUILDING_PLAN_ID,
  DRAFT_PLAN_ID,
  PENDING_PLAN_DAYS,
  withDraftPlan,
  withPlanBeingBuilt,
} from "@tests/factories/pending-plans";

// Starting data: an active 6-day plan (day 1 done, day 2 under way, its quiz
// on question 2), a completed 7-day plan, a ready 3-day plan, a saved 1-day
// plan, and the sample — plus, made the way New Plan makes them, a draft and a
// plan being built.
const state: AppState = withPlanBeingBuilt(withDraftPlan(INITIAL_STATE));
const ACTIVE = "plan-today-i-choose-to-be-a-blessing";
const COMPLETED = "plan-break-the-cycle-of-negative-thinking";
const READY = "plan-still-praying";
const DRAFT = DRAFT_PLAN_ID;
const BUILDING = BUILDING_PLAN_ID;
const SAVED = "plan-overcome-temptation";
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
  // Break the Cycle's day 6 Quick Check: left half-way, its second question picked, not submitted.
  const quizId = `${COMPLETED}-day-6-quiz`;
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
    title: "Still Praying",
    sermon: {
      title: "Still Praying",
      church: "Harbor Light Church",
      thumbnailUrl: null,
      thumbnailColors: [],
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
    const next = run({
      type: "generation/complete",
      content: content(PENDING_PLAN_DAYS),
      at: AT,
    });

    expect(getPlanById(next, BUILDING)?.status).toBe("ready");
    expect(isGeneratingPlan(next)).toBe(false);
    expect([1, 2].map((n) => getPlanDay(next, BUILDING, n)?.status)).toEqual([
      "available",
      "locked",
    ]);
  });

  it("refuses content that doesn't fit the plan", () => {
    expect(
      run({ type: "generation/complete", content: content(PENDING_PLAN_DAYS - 1), at: AT }),
    ).toBe(state);
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

describe("one domain operation, one dispatch", () => {
  const prayerOf = (id: string) => `${id}-prayer`;
  const prayerFor = (next: AppState, id: string) => find(next.prayers, prayerOf(id));

  describe("planDay/finish", () => {
    const finish = (id: string, prayerId: string | null): AppAction => ({
      type: "planDay/finish",
      dayId: id,
      prayerId,
      today: TODAY,
      at: AT,
    });
    const prayed = (id: string): AppAction => ({
      type: "prayer/markPrayed",
      prayerId: prayerOf(id),
      at: AT,
    });

    it("marks the prayer prayed then completes the day, as the two actions in order", () => {
      const day = dayId(ACTIVE, 2);
      const next = run(finish(day, prayerOf(day)));

      expect(next).toEqual(run(prayed(day), completeDay(ACTIVE, 2)));
      expect(prayerFor(next, day)?.prayedAt).toBe(AT);
      expect(getPlanDay(next, ACTIVE, 2)?.status).toBe("completed");
    });

    it("still marks the prayer on a plan's last day, though completing it completes the plan", () => {
      const day = dayId(SAVED, 1);
      const next = run(finish(day, prayerOf(day)));

      expect(getPlanById(next, SAVED)?.status).toBe("completed");
      expect(prayerFor(next, day)?.prayedAt).toBe(AT);
      expect(next).toEqual(run(prayed(day), completeDay(SAVED, 1)));
    });

    it("completes the day alone when there is no prayer", () => {
      const day = dayId(ACTIVE, 2);
      const next = run(finish(day, null));

      expect(next).toEqual(run(completeDay(ACTIVE, 2)));
      expect(prayerFor(next, day)?.prayedAt).toBeNull();
    });

    it("changes nothing on a locked day, and leaves its prayer unmarked", () => {
      const day = dayId(ACTIVE, 4);
      const next = run(finish(day, prayerOf(day)));

      expect(next).toBe(state);
      expect(prayerFor(next, day)?.prayedAt).toBeNull();
    });
  });

  describe("reflection/commit", () => {
    const first = `${dayId(ACTIVE, 2)}-reflection-1`;
    const second = `${dayId(ACTIVE, 2)}-reflection-2`;

    it("applies a mix of clear, save and update in order, as the separate actions would", () => {
      const writes: ReflectionWrite[] = [
        { kind: "clear", reflectionId: first },
        { kind: "save", reflectionId: second, answer: "In a friend." },
        { kind: "update", reflectionId: second, answer: "In my family." },
      ];
      const next = run({ type: "reflection/commit", writes, at: AT });

      expect(next).toEqual(
        run(
          { type: "reflection/clear", reflectionId: first, at: AT },
          { type: "reflection/save", reflectionId: second, answer: "In a friend.", at: AT },
          { type: "reflection/update", reflectionId: second, answer: "In my family.", at: AT },
        ),
      );
      expect(find(next.reflections, first)?.answer).toBeNull();
      expect(find(next.reflections, second)?.answer).toBe("In my family.");
    });

    it("returns the same state for an empty list of writes", () => {
      expect(run({ type: "reflection/commit", writes: [], at: AT })).toBe(state);
    });
  });

  describe("plan/createAndBuild", () => {
    const input = {
      planId: "plan-new",
      sermonId: "sermon-new",
      generationId: "generation-new",
      sourceUrl: "https://youtu.be/abc123",
      title: "A new sermon",
      lengthDays: 4 as const,
      quickCheckEnabled: true,
      at: AT,
    };
    const twoStep = (): AppAction[] => [
      { type: "plan/create", ...withoutGeneration(input) },
      { type: "generation/start", generationId: input.generationId, planId: input.planId, at: AT },
    ];
    function withoutGeneration({ generationId: _unused, ...rest }: typeof input) {
      return rest;
    }

    it("creates the plan and starts building it in one step", () => {
      const from = INITIAL_STATE;
      const next = appReducer(from, { type: "plan/createAndBuild", ...input });

      expect(next).toEqual(twoStep().reduce(appReducer, from));
      expect(getPlanById(next, "plan-new")?.status).toBe("generating");
      expect(next.generation?.planId).toBe("plan-new");
    });

    it("does whatever generation/start does when another plan is already being built", () => {
      const next = run({ type: "plan/createAndBuild", ...input });

      expect(next).toEqual(run(...twoStep()));
      expect(next.generation?.planId).toBe(BUILDING);
    });
  });

  describe("settings/reminderOn", () => {
    it("turns the reminder on at that time, as enabled then time would", () => {
      const next = run({
        type: "settings/reminderOn",
        reminderId: "reminder-quick-check",
        time: "20:15",
        at: AT,
      });

      expect(next).toEqual(
        run(
          {
            type: "settings/reminderEnabled",
            reminderId: "reminder-quick-check",
            enabled: true,
            at: AT,
          },
          {
            type: "settings/reminderTime",
            reminderId: "reminder-quick-check",
            time: "20:15",
            at: AT,
          },
        ),
      );
      expect(find(next.reminders, "reminder-quick-check")).toMatchObject({
        enabled: true,
        time: "20:15",
      });
    });

    it("changes nothing for an unknown reminder", () => {
      expect(
        run({ type: "settings/reminderOn", reminderId: "no-such-reminder", time: "20:15", at: AT }),
      ).toBe(state);
    });
  });
});

describe("reading settings", () => {
  it("starts at no offset on white paper", () => {
    expect(state.settings).toMatchObject({ readingTextOffset: 0, readingPaper: "white" });
  });

  it.each([-4, 0, 2, 8])("accepts a reading text offset of %i", (offset) => {
    const next = run({ type: "settings/readingTextOffset", offset, at: AT });

    expect(next.settings.readingTextOffset).toBe(offset);
  });

  it.each([-6, 10, 3, -3, 100])("refuses a reading text offset of %i", (offset) => {
    expect(run({ type: "settings/readingTextOffset", offset, at: AT })).toBe(state);
  });

  it("sets the reading paper", () => {
    const next = run({ type: "settings/readingPaper", paper: "sepia", at: AT });

    expect(next.settings.readingPaper).toBe("sepia");
  });
});
