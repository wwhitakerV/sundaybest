import type { Id, IsoDate, IsoDateTime, Plan, PlanDay, StudyStep } from "@/types/domain";

import type { AppAction } from "./actions";
import type { AppState } from "./state";
import { findById, listAll, withRecord, withoutRecord } from "./table";

const ALL_STEPS: readonly StudyStep[] = ["read", "scripture", "reflect", "pray"];

/** A ready plan starts the first time it's worked on; any other plan is left as it is. */
function startPlan(plan: Plan, today: IsoDate, at: IsoDateTime): Plan {
  if (plan.status !== "ready") return plan;
  return { ...plan, status: "active", startDate: today, startedAt: at, updatedAt: at };
}

function updatePlan(state: AppState, planId: Id, change: (plan: Plan) => Plan): AppState {
  const plan = findById(state.plans, planId);
  if (!plan) return state;
  const changed = change(plan);
  return changed === plan ? state : { ...state, plans: withRecord(state.plans, changed) };
}

/** A step of a day done: the day (and its plan) are under way. */
function completeStep(
  state: AppState,
  dayId: Id,
  step: StudyStep,
  today: IsoDate,
  at: IsoDateTime,
): AppState {
  const day = findById(state.planDays, dayId);
  if (!day || day.status === "locked") return state;
  const started: PlanDay = {
    ...day,
    status: day.status === "completed" ? "completed" : "inProgress",
    completedSteps: day.completedSteps.includes(step)
      ? day.completedSteps
      : [...day.completedSteps, step],
    startedAt: day.startedAt ?? at,
    updatedAt: at,
  };
  const withDay = { ...state, planDays: withRecord(state.planDays, started) };
  return updatePlan(withDay, day.planId, (plan) => startPlan(plan, today, at));
}

/**
 * A day finished: every step done, the next day opened, and — once every day
 * is done — the plan completed.
 */
function completeDay(state: AppState, dayId: Id, today: IsoDate, at: IsoDateTime): AppState {
  const day = findById(state.planDays, dayId);
  if (!day || day.status === "locked" || day.status === "completed") return state;

  let planDays = withRecord(state.planDays, {
    ...day,
    status: "completed",
    completedSteps: [...ALL_STEPS],
    startedAt: day.startedAt ?? at,
    completedAt: at,
    updatedAt: at,
  });
  const siblings = listAll(planDays).filter((other) => other.planId === day.planId);
  const next = siblings.find((other) => other.dayNumber === day.dayNumber + 1);
  if (next?.status === "locked") {
    planDays = withRecord(planDays, { ...next, status: "available", updatedAt: at });
  }
  const allDone = siblings.every((other) => other.id === day.id || other.status === "completed");

  return updatePlan({ ...state, planDays }, day.planId, (plan) => {
    const started = startPlan(plan, today, at);
    return allDone ? { ...started, status: "completed", completedAt: at, updatedAt: at } : started;
  });
}

/**
 * The store's reducer. Pure: it never reads the clock or makes IDs — both
 * come in on the action — and an action that doesn't apply (an unknown ID, a
 * locked day) leaves the state untouched.
 */
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "settings/update":
      return { ...state, settings: { ...state.settings, ...action.changes, updatedAt: action.at } };

    case "reminder/update": {
      const reminder = findById(state.reminders, action.reminderId);
      if (!reminder) return state;
      return {
        ...state,
        reminders: withRecord(state.reminders, {
          ...reminder,
          ...action.changes,
          updatedAt: action.at,
        }),
      };
    }

    case "plan/start":
      return updatePlan(state, action.planId, (plan) => startPlan(plan, action.today, action.at));

    case "plan/archive":
      return updatePlan(state, action.planId, (plan) => ({
        ...plan,
        status: "archived",
        archivedAt: action.at,
        updatedAt: action.at,
      }));

    case "planDay/completeStep":
      return completeStep(state, action.dayId, action.step, action.today, action.at);

    case "planDay/complete":
      return completeDay(state, action.dayId, action.today, action.at);

    case "reflection/answer": {
      const reflection = findById(state.reflections, action.reflectionId);
      if (!reflection) return state;
      return {
        ...state,
        reflections: withRecord(state.reflections, {
          ...reflection,
          answer: action.answer,
          answeredAt: action.at,
          updatedAt: action.at,
        }),
      };
    }

    case "prayer/markPrayed": {
      const prayer = findById(state.prayers, action.prayerId);
      if (!prayer) return state;
      return {
        ...state,
        prayers: withRecord(state.prayers, {
          ...prayer,
          prayedAt: action.at,
          updatedAt: action.at,
        }),
      };
    }

    case "quiz/startAttempt":
      if (!findById(state.quizzes, action.quizId)) return state;
      return {
        ...state,
        quizAttempts: withRecord(state.quizAttempts, {
          id: action.attemptId,
          createdAt: action.at,
          updatedAt: action.at,
          quizId: action.quizId,
          status: "inProgress",
          startedAt: action.at,
          completedAt: null,
        }),
      };

    case "quiz/answer": {
      const attempt = findById(state.quizAttempts, action.attemptId);
      const question = findById(state.quizQuestions, action.questionId);
      if (attempt?.status !== "inProgress" || question?.quizId !== attempt.quizId) return state;
      // One answer per question per attempt: a new pick replaces the last.
      const previous = listAll(state.quizAnswers).find(
        (answer) => answer.attemptId === attempt.id && answer.questionId === question.id,
      );
      const answers = previous ? withoutRecord(state.quizAnswers, previous.id) : state.quizAnswers;
      return {
        ...state,
        quizAnswers: withRecord(answers, {
          id: action.answerId,
          createdAt: action.at,
          updatedAt: action.at,
          attemptId: attempt.id,
          questionId: question.id,
          choiceId: action.choiceId,
          answeredAt: action.at,
        }),
        quizAttempts: withRecord(state.quizAttempts, { ...attempt, updatedAt: action.at }),
      };
    }

    case "quiz/completeAttempt": {
      const attempt = findById(state.quizAttempts, action.attemptId);
      if (attempt?.status !== "inProgress") return state;
      return {
        ...state,
        quizAttempts: withRecord(state.quizAttempts, {
          ...attempt,
          status: "completed",
          completedAt: action.at,
          updatedAt: action.at,
        }),
      };
    }

    case "library/save":
      return {
        ...state,
        library: withRecord(state.library, {
          id: action.libraryItemId,
          createdAt: action.at,
          updatedAt: action.at,
          userId: state.user.id,
          kind: action.kind,
          itemId: action.itemId,
          savedAt: action.at,
          note: action.note,
        }),
      };

    case "library/remove":
      return { ...state, library: withoutRecord(state.library, action.libraryItemId) };

    case "generation/set":
      return { ...state, generation: action.generation };
  }
}
