import {
  INITIAL_STATE,
  appReducer,
  getExamAttempt,
  getExamConceptsForReview,
  getExamItemResponse,
  getLatestCompletedExamAttempt,
  getOpenExamAttempt,
  type AppAction,
  type AppState,
} from "@/core/store";
import {
  aMatchingItem,
  aMultipleSelectItem,
  anExamResult,
  anOrderingItem,
  aSingleChoiceItem,
  aTrueFalseItem,
  checkResponseAction,
  completeAttemptAction,
  matchingResponse,
  orderingResponse,
  recordResponseAction,
  singleChoiceResponse,
  startAttemptAction,
  trueFalseResponse,
} from "@tests/factories/exam-attempts";

/**
 * The reducer's "no second open attempt" rule (criterion 8) is read as
 * scoped per (examId, mode): otherwise a Study Mode attempt that has
 * checked at least one answer but hasn't finished (every item must be
 * checked to finish one, per criterion 27) could never coexist with a new
 * Exam Mode attempt at the same exam, and criteria 34/35's Practice rule —
 * which is decided by a Study attempt's *checked* state, not by it being
 * finished — would be untestable. See criteria 34 and 35 below.
 */

const EXAM_ID = "exam-theo-01-01";
const AT = "2026-09-28T09:00:00.000Z";
const AT2 = "2026-09-28T09:05:00.000Z";
const AT3 = "2026-09-28T09:10:00.000Z";

const SINGLE = aSingleChoiceItem({ questionId: "q-single-choice" });
const TRUE_FALSE = aTrueFalseItem({ questionId: "q-true-false" });
const MULTI = aMultipleSelectItem({ questionId: "q-multiple-select" });
const MATCHING = aMatchingItem({ questionId: "q-matching" });
const ORDERING = anOrderingItem({ questionId: "q-ordering" });
const ITEMS = [SINGLE, TRUE_FALSE, MULTI, MATCHING, ORDERING];

const state: AppState = INITIAL_STATE;
const run = (...actions: AppAction[]): AppState => actions.reduce(appReducer, state);

const start = (overrides: Partial<ReturnType<typeof startAttemptAction>> = {}) =>
  startAttemptAction({ examId: EXAM_ID, items: ITEMS, ...overrides });

describe("exam/startAttempt", () => {
  it("starts an in-progress attempt with the given snapshot (criteria 8, 34, 36)", () => {
    const next = run(start({ attemptId: "attempt-1", examVersion: 4, mode: "exam", at: AT }));

    expect(getExamAttempt(next, "attempt-1")).toMatchObject({
      examId: EXAM_ID,
      examVersion: 4,
      mode: "exam",
      practice: false,
      items: ITEMS,
      responses: [],
      status: "inProgress",
      startedAt: AT,
      completedAt: null,
      result: null,
    });
  });

  it("won't start over an attempt id that already exists", () => {
    const next = run(start({ attemptId: "attempt-1" }));
    // Guards the "won't" assertion below: without this, a reducer that does
    // nothing at all would make both sides of `.toBe(next)` the same
    // `undefined`, passing for the wrong reason.
    expect(getExamAttempt(next, "attempt-1")).not.toBeNull();

    expect(appReducer(next, start({ attemptId: "attempt-1", examId: "some-other-exam" }))).toBe(
      next,
    );
  });

  it("won't start an attempt with no items", () => {
    expect(run(start({ attemptId: "attempt-1", items: [] }))).toBe(state);
  });

  it("won't open a second attempt while one is already in progress for the exam (criterion 8)", () => {
    const next = run(start({ attemptId: "attempt-1", mode: "exam" }));
    expect(getExamAttempt(next, "attempt-1")).not.toBeNull(); // guards the assertion below

    expect(appReducer(next, start({ attemptId: "attempt-2", mode: "exam" }))).toBe(next);
  });

  it("opens an Exam Mode attempt while a Study Mode attempt is still open (criterion 8)", () => {
    const next = run(
      start({ attemptId: "attempt-study", mode: "study" }),
      start({ attemptId: "attempt-exam", mode: "exam" }),
    );

    expect(getExamAttempt(next, "attempt-exam")?.status).toBe("inProgress");
  });

  it("opens a Study Mode attempt while an Exam Mode attempt is still open (criterion 8)", () => {
    const next = run(
      start({ attemptId: "attempt-exam", mode: "exam" }),
      start({ attemptId: "attempt-study", mode: "study" }),
    );

    expect(getExamAttempt(next, "attempt-study")?.status).toBe("inProgress");
  });

  it("does not mark a first Exam Mode attempt Practice", () => {
    const next = run(start({ attemptId: "attempt-1", mode: "exam" }));

    expect(getExamAttempt(next, "attempt-1")?.practice).toBe(false);
  });

  it("marks a later Exam Mode attempt Practice once an earlier Exam Mode attempt was submitted (criterion 34)", () => {
    const submitted = appReducer(
      run(start({ attemptId: "attempt-1", mode: "exam" })),
      completeAttemptAction({ attemptId: "attempt-1", result: anExamResult(), at: AT2 }),
    );
    const next = appReducer(submitted, start({ attemptId: "attempt-2", mode: "exam" }));

    expect(getExamAttempt(next, "attempt-2")?.practice).toBe(true);
  });

  it("marks a later Exam Mode attempt Practice once a Study Mode attempt had a checked answer (criterion 34)", () => {
    const studying = run(start({ attemptId: "attempt-study", mode: "study" }));
    const responded = appReducer(
      studying,
      recordResponseAction({
        attemptId: "attempt-study",
        questionId: SINGLE.questionId,
        response: singleChoiceResponse("A"),
        at: AT,
      }),
    );
    const checked = appReducer(
      responded,
      checkResponseAction({
        attemptId: "attempt-study",
        questionId: SINGLE.questionId,
        correct: true,
        at: AT2,
      }),
    );
    const next = appReducer(checked, start({ attemptId: "attempt-exam", mode: "exam" }));

    expect(getExamAttempt(next, "attempt-exam")?.practice).toBe(true);
  });

  it("marks an Exam Mode attempt already open Practice once a Study Mode answer is checked before it's submitted (criterion 34)", () => {
    const next = run(
      start({ attemptId: "attempt-exam", mode: "exam" }),
      start({ attemptId: "attempt-study", mode: "study" }),
      recordResponseAction({
        attemptId: "attempt-study",
        questionId: SINGLE.questionId,
        response: singleChoiceResponse("A"),
        at: AT,
      }),
      checkResponseAction({
        attemptId: "attempt-study",
        questionId: SINGLE.questionId,
        correct: true,
        at: AT2,
      }),
    );

    expect(getExamAttempt(next, "attempt-exam")?.practice).toBe(true);
  });

  it("leaves another exam's open Exam Mode attempt alone when a Study Mode answer is checked", () => {
    const next = run(
      start({ attemptId: "attempt-other-exam", examId: "some-other-exam", mode: "exam" }),
      start({ attemptId: "attempt-study", mode: "study" }),
      recordResponseAction({
        attemptId: "attempt-study",
        questionId: SINGLE.questionId,
        response: singleChoiceResponse("A"),
        at: AT,
      }),
      checkResponseAction({
        attemptId: "attempt-study",
        questionId: SINGLE.questionId,
        correct: true,
        at: AT2,
      }),
    );
    expect(getExamAttempt(next, "attempt-study")?.responses[0]?.check).not.toBeNull(); // guards the assertion below

    expect(getExamAttempt(next, "attempt-other-exam")?.practice).toBe(false);
  });

  it("does not mark an Exam Mode attempt Practice when the Study Mode attempt has responses but nothing checked (criterion 35)", () => {
    const studying = run(start({ attemptId: "attempt-study", mode: "study" }));
    const responded = appReducer(
      studying,
      recordResponseAction({
        attemptId: "attempt-study",
        questionId: SINGLE.questionId,
        response: singleChoiceResponse("A"),
        at: AT,
      }),
    );
    const next = appReducer(responded, start({ attemptId: "attempt-exam", mode: "exam" }));

    expect(getExamAttempt(next, "attempt-exam")?.practice).toBe(false);
  });

  it("never marks a Study Mode attempt Practice, even after a submitted Exam Mode attempt", () => {
    const submitted = appReducer(
      run(start({ attemptId: "attempt-1", mode: "exam" })),
      completeAttemptAction({ attemptId: "attempt-1", result: anExamResult(), at: AT2 }),
    );
    const next = appReducer(submitted, start({ attemptId: "attempt-study", mode: "study" }));

    expect(getExamAttempt(next, "attempt-study")?.practice).toBe(false);
  });

  it("keeps an attempt's original exam version after a later start with a higher version (criterion 36)", () => {
    const firstCompleted = appReducer(
      run(start({ attemptId: "attempt-1", examVersion: 4 })),
      completeAttemptAction({ attemptId: "attempt-1", result: anExamResult(), at: AT2 }),
    );
    const next = appReducer(firstCompleted, start({ attemptId: "attempt-2", examVersion: 5 }));

    expect(getExamAttempt(next, "attempt-1")?.examVersion).toBe(4);
  });
});

describe("exam/recordResponse", () => {
  it("adds a response, leaving other questions' responses untouched", () => {
    const started = run(start({ attemptId: "attempt-1" }));
    const firstAnswered = appReducer(
      started,
      recordResponseAction({
        attemptId: "attempt-1",
        questionId: SINGLE.questionId,
        response: singleChoiceResponse("A"),
        at: AT,
      }),
    );
    const secondAnswered = appReducer(
      firstAnswered,
      recordResponseAction({
        attemptId: "attempt-1",
        questionId: TRUE_FALSE.questionId,
        response: trueFalseResponse("T"),
        at: AT2,
      }),
    );
    const attempt = getExamAttempt(secondAnswered, "attempt-1")!;

    expect(getExamItemResponse(attempt, SINGLE.questionId)).toMatchObject({
      response: singleChoiceResponse("A"),
      respondedAt: AT,
    });
    expect(getExamItemResponse(attempt, TRUE_FALSE.questionId)).toMatchObject({
      response: trueFalseResponse("T"),
      respondedAt: AT2,
    });
  });

  it("replaces the response already given to a question", () => {
    const started = run(start({ attemptId: "attempt-1" }));
    const first = appReducer(
      started,
      recordResponseAction({
        attemptId: "attempt-1",
        questionId: SINGLE.questionId,
        response: singleChoiceResponse("A"),
        at: AT,
      }),
    );
    const replaced = appReducer(
      first,
      recordResponseAction({
        attemptId: "attempt-1",
        questionId: SINGLE.questionId,
        response: singleChoiceResponse("B"),
        at: AT2,
      }),
    );
    const attempt = getExamAttempt(replaced, "attempt-1")!;

    expect(attempt.responses).toHaveLength(1);
    expect(getExamItemResponse(attempt, SINGLE.questionId)).toMatchObject({
      response: singleChoiceResponse("B"),
      respondedAt: AT2,
    });
  });

  it("won't record a response to an attempt that doesn't exist", () => {
    expect(
      run(
        recordResponseAction({
          attemptId: "no-such-attempt",
          questionId: SINGLE.questionId,
          response: singleChoiceResponse("A"),
        }),
      ),
    ).toBe(state);
  });

  it("won't change a response on a submitted attempt (criterion 20)", () => {
    const completed = appReducer(
      run(start({ attemptId: "attempt-1" })),
      completeAttemptAction({ attemptId: "attempt-1", result: anExamResult(), at: AT }),
    );
    expect(getExamAttempt(completed, "attempt-1")?.status).toBe("completed"); // guards below

    expect(
      appReducer(
        completed,
        recordResponseAction({
          attemptId: "attempt-1",
          questionId: SINGLE.questionId,
          response: singleChoiceResponse("A"),
          at: AT2,
        }),
      ),
    ).toBe(completed);
  });

  it("won't record a response to a question that isn't one of the attempt's items", () => {
    const started = run(start({ attemptId: "attempt-1" }));
    expect(getExamAttempt(started, "attempt-1")).not.toBeNull(); // guards below

    expect(
      appReducer(
        started,
        recordResponseAction({
          attemptId: "attempt-1",
          questionId: "question-not-in-attempt",
          response: singleChoiceResponse("A"),
        }),
      ),
    ).toBe(started);
  });

  it("won't record a response whose kind differs from the item's kind", () => {
    const started = run(start({ attemptId: "attempt-1" }));
    expect(getExamAttempt(started, "attempt-1")).not.toBeNull(); // guards below

    expect(
      appReducer(
        started,
        recordResponseAction({
          attemptId: "attempt-1",
          questionId: SINGLE.questionId,
          response: orderingResponse(["S1", "S2"]),
        }),
      ),
    ).toBe(started);
  });

  it("won't record a response with an id that does not belong to the item", () => {
    const started = run(start({ attemptId: "attempt-1" }));
    expect(getExamAttempt(started, "attempt-1")).not.toBeNull(); // guards below

    expect(
      appReducer(
        started,
        recordResponseAction({
          attemptId: "attempt-1",
          questionId: SINGLE.questionId,
          response: singleChoiceResponse("Z"),
        }),
      ),
    ).toBe(started);
  });

  it("won't record a matching response that pairs one target with two prompts (criterion 12)", () => {
    const started = run(start({ attemptId: "attempt-1" }));
    expect(getExamAttempt(started, "attempt-1")).not.toBeNull(); // guards below
    const response = matchingResponse([
      { promptId: "P1", targetId: "R1" },
      { promptId: "P2", targetId: "R1" },
    ]);

    expect(
      appReducer(
        started,
        recordResponseAction({ attemptId: "attempt-1", questionId: MATCHING.questionId, response }),
      ),
    ).toBe(started);
  });

  it("won't record an ordering response with a duplicate step id", () => {
    const started = run(start({ attemptId: "attempt-1" }));
    expect(getExamAttempt(started, "attempt-1")).not.toBeNull(); // guards below
    const response = orderingResponse(["S1", "S1"]);

    expect(
      appReducer(
        started,
        recordResponseAction({ attemptId: "attempt-1", questionId: ORDERING.questionId, response }),
      ),
    ).toBe(started);
  });

  it("won't change a response to a Study Mode question already checked (criterion 22)", () => {
    const responded = appReducer(
      run(start({ attemptId: "attempt-1", mode: "study" })),
      recordResponseAction({
        attemptId: "attempt-1",
        questionId: SINGLE.questionId,
        response: singleChoiceResponse("A"),
        at: AT,
      }),
    );
    const checked = appReducer(
      responded,
      checkResponseAction({
        attemptId: "attempt-1",
        questionId: SINGLE.questionId,
        correct: true,
        at: AT2,
      }),
    );
    // Guards the assertion below.
    expect(
      getExamItemResponse(getExamAttempt(checked, "attempt-1")!, SINGLE.questionId)?.check,
    ).not.toBeNull();

    expect(
      appReducer(
        checked,
        recordResponseAction({
          attemptId: "attempt-1",
          questionId: SINGLE.questionId,
          response: singleChoiceResponse("B"),
          at: AT3,
        }),
      ),
    ).toBe(checked);
  });
});

describe("exam/checkResponse", () => {
  it("checks a complete Study Mode response, recording when and whether it was correct", () => {
    const responded = appReducer(
      run(start({ attemptId: "attempt-1", mode: "study" })),
      recordResponseAction({
        attemptId: "attempt-1",
        questionId: SINGLE.questionId,
        response: singleChoiceResponse("A"),
        at: AT,
      }),
    );
    const checked = appReducer(
      responded,
      checkResponseAction({
        attemptId: "attempt-1",
        questionId: SINGLE.questionId,
        correct: true,
        at: AT2,
      }),
    );

    expect(
      getExamItemResponse(getExamAttempt(checked, "attempt-1")!, SINGLE.questionId),
    ).toMatchObject({
      check: { at: AT2, correct: true },
    });
  });

  it("won't check a response in Exam Mode", () => {
    const responded = appReducer(
      run(start({ attemptId: "attempt-1", mode: "exam" })),
      recordResponseAction({
        attemptId: "attempt-1",
        questionId: SINGLE.questionId,
        response: singleChoiceResponse("A"),
        at: AT,
      }),
    );
    // Guards the assertion below.
    expect(
      getExamItemResponse(getExamAttempt(responded, "attempt-1")!, SINGLE.questionId),
    ).not.toBeNull();

    expect(
      appReducer(
        responded,
        checkResponseAction({
          attemptId: "attempt-1",
          questionId: SINGLE.questionId,
          correct: true,
          at: AT2,
        }),
      ),
    ).toBe(responded);
  });

  it("won't check a question with no response (criterion 21)", () => {
    const started = run(start({ attemptId: "attempt-1", mode: "study" }));
    expect(getExamAttempt(started, "attempt-1")?.mode).toBe("study"); // guards below

    expect(
      appReducer(
        started,
        checkResponseAction({
          attemptId: "attempt-1",
          questionId: SINGLE.questionId,
          correct: true,
          at: AT,
        }),
      ),
    ).toBe(started);
  });

  it("won't check an incomplete response (criterion 21)", () => {
    const responded = appReducer(
      run(start({ attemptId: "attempt-1", mode: "study" })),
      recordResponseAction({
        attemptId: "attempt-1",
        questionId: MATCHING.questionId,
        response: matchingResponse([{ promptId: "P1", targetId: "R1" }]),
        at: AT,
      }),
    );
    // Guards the assertion below.
    expect(
      getExamItemResponse(getExamAttempt(responded, "attempt-1")!, MATCHING.questionId),
    ).not.toBeNull();

    expect(
      appReducer(
        responded,
        checkResponseAction({
          attemptId: "attempt-1",
          questionId: MATCHING.questionId,
          correct: true,
          at: AT2,
        }),
      ),
    ).toBe(responded);
  });

  it("won't check a response already checked", () => {
    const responded = appReducer(
      run(start({ attemptId: "attempt-1", mode: "study" })),
      recordResponseAction({
        attemptId: "attempt-1",
        questionId: SINGLE.questionId,
        response: singleChoiceResponse("A"),
        at: AT,
      }),
    );
    const checked = appReducer(
      responded,
      checkResponseAction({
        attemptId: "attempt-1",
        questionId: SINGLE.questionId,
        correct: true,
        at: AT2,
      }),
    );
    // Guards the assertion below.
    expect(
      getExamItemResponse(getExamAttempt(checked, "attempt-1")!, SINGLE.questionId)?.check,
    ).not.toBeNull();

    expect(
      appReducer(
        checked,
        checkResponseAction({
          attemptId: "attempt-1",
          questionId: SINGLE.questionId,
          correct: false,
          at: AT3,
        }),
      ),
    ).toBe(checked);
  });
});

describe("exam/completeAttempt", () => {
  it("completes an Exam Mode attempt with questions still unanswered (criterion 19)", () => {
    const started = run(start({ attemptId: "attempt-1", mode: "exam" }));
    const result = anExamResult();
    const completed = appReducer(
      started,
      completeAttemptAction({ attemptId: "attempt-1", result, at: AT2 }),
    );

    expect(getExamAttempt(completed, "attempt-1")).toMatchObject({
      status: "completed",
      completedAt: AT2,
      result,
    });
  });

  it("won't complete an attempt that doesn't exist", () => {
    expect(run(completeAttemptAction({ attemptId: "no-such-attempt", at: AT }))).toBe(state);
  });

  it("won't complete an attempt a second time (criterion 20)", () => {
    const completed = appReducer(
      run(start({ attemptId: "attempt-1" })),
      completeAttemptAction({ attemptId: "attempt-1", result: anExamResult(), at: AT }),
    );
    expect(getExamAttempt(completed, "attempt-1")?.status).toBe("completed"); // guards below

    expect(
      appReducer(
        completed,
        completeAttemptAction({
          attemptId: "attempt-1",
          result: anExamResult({ correct: 1 }),
          at: AT2,
        }),
      ),
    ).toBe(completed);
  });

  it("won't complete a Study Mode attempt with any item not yet checked (criterion 27)", () => {
    const items = [
      aSingleChoiceItem({ questionId: "q1" }),
      aSingleChoiceItem({ questionId: "q2" }),
    ];
    const started = run(start({ attemptId: "attempt-1", mode: "study", items }));
    const oneChecked = appReducer(
      appReducer(
        started,
        recordResponseAction({
          attemptId: "attempt-1",
          questionId: "q1",
          response: singleChoiceResponse("A"),
          at: AT,
        }),
      ),
      checkResponseAction({ attemptId: "attempt-1", questionId: "q1", correct: true, at: AT2 }),
    );
    // Guards the assertion below.
    expect(
      getExamItemResponse(getExamAttempt(oneChecked, "attempt-1")!, "q1")?.check,
    ).not.toBeNull();

    expect(
      appReducer(
        oneChecked,
        completeAttemptAction({ attemptId: "attempt-1", result: anExamResult(), at: AT3 }),
      ),
    ).toBe(oneChecked);
  });

  it("completes a Study Mode attempt once every item is checked (criterion 27)", () => {
    const items = [
      aSingleChoiceItem({ questionId: "q1" }),
      aSingleChoiceItem({ questionId: "q2" }),
    ];
    const started = run(start({ attemptId: "attempt-1", mode: "study", items }));
    const bothChecked = items.reduce(
      (current, item) =>
        appReducer(
          appReducer(
            current,
            recordResponseAction({
              attemptId: "attempt-1",
              questionId: item.questionId,
              response: singleChoiceResponse("A"),
              at: AT,
            }),
          ),
          checkResponseAction({
            attemptId: "attempt-1",
            questionId: item.questionId,
            correct: true,
            at: AT2,
          }),
        ),
      started,
    );

    const completed = appReducer(
      bothChecked,
      completeAttemptAction({ attemptId: "attempt-1", result: anExamResult(), at: AT3 }),
    );

    expect(getExamAttempt(completed, "attempt-1")?.status).toBe("completed");
  });

  it("keeps the full snapshot once completed: responses, timestamps, and the result (criterion 36)", () => {
    const started = run(start({ attemptId: "attempt-1", examVersion: 4, mode: "exam", at: AT }));
    const responded = appReducer(
      started,
      recordResponseAction({
        attemptId: "attempt-1",
        questionId: SINGLE.questionId,
        response: singleChoiceResponse("A"),
        at: AT2,
      }),
    );
    const result = anExamResult();
    const completed = appReducer(
      responded,
      completeAttemptAction({ attemptId: "attempt-1", result, at: AT3 }),
    );
    const attempt = getExamAttempt(completed, "attempt-1")!;

    expect(attempt).toMatchObject({
      examId: EXAM_ID,
      examVersion: 4,
      mode: "exam",
      startedAt: AT,
      completedAt: AT3,
      result,
    });
    expect(getExamItemResponse(attempt, SINGLE.questionId)).toMatchObject({
      response: singleChoiceResponse("A"),
      respondedAt: AT2,
    });
  });
});

describe("getExamAttempt", () => {
  it("finds an attempt by id", () => {
    const next = run(start({ attemptId: "attempt-1" }));

    expect(getExamAttempt(next, "attempt-1")?.examId).toBe(EXAM_ID);
  });

  it("returns null for an unknown attempt id", () => {
    expect(getExamAttempt(state, "no-such-attempt")).toBeNull();
  });
});

describe("getOpenExamAttempt", () => {
  it("finds the in-progress attempt for an exam", () => {
    const next = run(start({ attemptId: "attempt-1" }));

    expect(getOpenExamAttempt(next, EXAM_ID)?.id).toBe("attempt-1");
  });

  it("returns null once the exam's attempt has been completed", () => {
    const completed = appReducer(
      run(start({ attemptId: "attempt-1" })),
      completeAttemptAction({ attemptId: "attempt-1", result: anExamResult(), at: AT }),
    );

    expect(getOpenExamAttempt(completed, EXAM_ID)).toBeNull();
  });

  it("returns null for an exam with no attempt", () => {
    expect(getOpenExamAttempt(state, EXAM_ID)).toBeNull();
  });

  it("finds only the open attempt in the mode asked for (criterion 8)", () => {
    const next = run(
      start({ attemptId: "attempt-exam", mode: "exam" }),
      start({ attemptId: "attempt-study", mode: "study", at: AT2 }),
    );

    expect(getOpenExamAttempt(next, EXAM_ID, "exam")?.id).toBe("attempt-exam");
  });
});

describe("getLatestCompletedExamAttempt", () => {
  it("returns the attempt completed most recently", () => {
    const firstCompleted = appReducer(
      run(start({ attemptId: "attempt-1" })),
      completeAttemptAction({ attemptId: "attempt-1", result: anExamResult(), at: AT }),
    );
    const secondStarted = appReducer(firstCompleted, start({ attemptId: "attempt-2" }));
    const secondCompleted = appReducer(
      secondStarted,
      completeAttemptAction({ attemptId: "attempt-2", result: anExamResult(), at: AT3 }),
    );

    expect(getLatestCompletedExamAttempt(secondCompleted, EXAM_ID)?.id).toBe("attempt-2");
  });

  it("returns null when nothing has been completed yet", () => {
    const next = run(start({ attemptId: "attempt-1" }));

    expect(getLatestCompletedExamAttempt(next, EXAM_ID)).toBeNull();
  });
});

describe("getExamConceptsForReview (criterion 33)", () => {
  it("lists each missed primary concept once, in item order", () => {
    const items = [
      aSingleChoiceItem({ questionId: "q1", primaryConceptId: "concept-canon" }),
      aTrueFalseItem({ questionId: "q2", primaryConceptId: "concept-canon" }),
      aMultipleSelectItem({ questionId: "q3", primaryConceptId: "concept-scripture" }),
      aMatchingItem({ questionId: "q4", primaryConceptId: "concept-councils" }),
      anOrderingItem({ questionId: "q5", primaryConceptId: "concept-scripture" }),
    ];
    const result = anExamResult({
      items: [
        { questionId: "q1", correct: false, answered: true },
        { questionId: "q2", correct: true, answered: true },
        { questionId: "q3", correct: false, answered: true },
        { questionId: "q4", correct: true, answered: true },
        { questionId: "q5", correct: false, answered: true },
      ],
    });
    const completed = appReducer(
      run(start({ attemptId: "attempt-1", items })),
      completeAttemptAction({ attemptId: "attempt-1", result, at: AT2 }),
    );

    expect(getExamConceptsForReview(completed, EXAM_ID)).toEqual([
      "concept-canon",
      "concept-scripture",
    ]);
  });

  it("includes a Study attempt's missed concepts too", () => {
    const items = [aSingleChoiceItem({ questionId: "q1", primaryConceptId: "concept-canon" })];
    const result = anExamResult({
      items: [{ questionId: "q1", correct: false, answered: true }],
      concepts: [],
    });
    const responded = appReducer(
      run(start({ attemptId: "attempt-study", mode: "study", items })),
      recordResponseAction({
        attemptId: "attempt-study",
        questionId: "q1",
        response: singleChoiceResponse("A"),
        at: AT,
      }),
    );
    const checked = appReducer(
      responded,
      checkResponseAction({
        attemptId: "attempt-study",
        questionId: "q1",
        correct: false,
        at: AT2,
      }),
    );
    const completed = appReducer(
      checked,
      completeAttemptAction({ attemptId: "attempt-study", result, at: AT3 }),
    );

    expect(getExamConceptsForReview(completed, EXAM_ID)).toEqual(["concept-canon"]);
  });

  it("returns an empty list when nothing was missed", () => {
    const result = anExamResult({
      items: ITEMS.map((item) => ({ questionId: item.questionId, correct: true, answered: true })),
    });
    const completed = appReducer(
      run(start({ attemptId: "attempt-1" })),
      completeAttemptAction({ attemptId: "attempt-1", result, at: AT2 }),
    );

    expect(getExamConceptsForReview(completed, EXAM_ID)).toEqual([]);
  });

  it("returns an empty list when the exam has no completed attempt", () => {
    expect(getExamConceptsForReview(state, EXAM_ID)).toEqual([]);
  });

  it("uses only the latest completed attempt's misses, not an earlier attempt's", () => {
    const firstItems = [aSingleChoiceItem({ questionId: "q1", primaryConceptId: "concept-canon" })];
    const firstResult = anExamResult({
      items: [{ questionId: "q1", correct: false, answered: true }],
    });
    const firstCompleted = appReducer(
      run(start({ attemptId: "attempt-1", items: firstItems })),
      completeAttemptAction({ attemptId: "attempt-1", result: firstResult, at: AT }),
    );

    const secondItems = [
      aSingleChoiceItem({ questionId: "q2", primaryConceptId: "concept-scripture" }),
    ];
    const secondResult = anExamResult({
      items: [{ questionId: "q2", correct: false, answered: true }],
    });
    const secondCompleted = appReducer(
      appReducer(firstCompleted, start({ attemptId: "attempt-2", items: secondItems })),
      completeAttemptAction({ attemptId: "attempt-2", result: secondResult, at: AT3 }),
    );

    expect(getExamConceptsForReview(secondCompleted, EXAM_ID)).toEqual(["concept-scripture"]);
  });
});
