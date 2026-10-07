import { appReducer, getPlanDay, type AppState } from "@/core/store";
import type { IsoDate, IsoDateTime } from "@/types/domain";

const ALL_STEPS = ["read", "scripture", "reflect", "pray"] as const;

/**
 * The state after the reader works through this day's four steps — Pray
 * among them — on `today`, through the store's own actions, as the Daily Study
 * does (which starts a plan not yet started). A day not open on `today` is
 * left as it was.
 */
export function withStepsDone(
  state: AppState,
  planId: string,
  dayNumber: number,
  today: IsoDate,
  at: IsoDateTime,
): AppState {
  const day = getPlanDay(state, planId, dayNumber);
  if (!day) throw new Error(`No day ${dayNumber} in ${planId}`);
  return ALL_STEPS.reduce(
    (current, completedStep) =>
      appReducer(current, { type: "planDay/update", dayId: day.id, completedStep, today, at }),
    state,
  );
}

/** The state with this day's Quick Check, if it has one, taken to the end. */
export function withQuickCheckDone(
  state: AppState,
  planId: string,
  dayNumber: number,
  at: IsoDateTime,
): AppState {
  const day = getPlanDay(state, planId, dayNumber);
  if (!day) throw new Error(`No day ${dayNumber} in ${planId}`);
  const quiz = Object.values(state.quizzes).find((candidate) => candidate.planDayId === day.id);
  if (!quiz) return state;
  const existing = Object.values(state.quizAttempts).find((attempt) => attempt.quizId === quiz.id);
  const attempt = {
    id: existing?.id ?? `${quiz.id}-attempt-done`,
    createdAt: existing?.createdAt ?? at,
    startedAt: existing?.startedAt ?? at,
    quizId: quiz.id,
    status: "completed" as const,
    currentQuestionId: null,
    selectedChoiceId: null,
    completedAt: at,
    updatedAt: at,
  };
  return { ...state, quizAttempts: { ...state.quizAttempts, [attempt.id]: attempt } };
}

/** Everything completing this day on `today` asks for: its steps done and its Quick Check finished. */
export function readyToComplete(
  state: AppState,
  planId: string,
  dayNumber: number,
  today: IsoDate,
  at: IsoDateTime,
): AppState {
  return withQuickCheckDone(
    withStepsDone(state, planId, dayNumber, today, at),
    planId,
    dayNumber,
    at,
  );
}
