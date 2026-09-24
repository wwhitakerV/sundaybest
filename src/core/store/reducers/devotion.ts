import type { AppAction } from "../actions";
import type { AppState } from "../state";
import { findById, withRecord } from "../table";
import { isStudyable } from "./plans";

type Action<Type extends AppAction["type"]> = Extract<AppAction, { type: Type }>;

/** Whether the day a reflection or prayer belongs to is open to work on. */
function isDayOpen(state: AppState, dayId: string): boolean {
  const day = findById(state.planDays, dayId);
  const plan = day ? findById(state.plans, day.planId) : null;
  return Boolean(day && plan && day.status !== "locked" && isStudyable(plan));
}

/** A first answer to a reflection question. Not empty; not over an existing answer. */
export function saveReflection(state: AppState, action: Action<"reflection/save">): AppState {
  const reflection = findById(state.reflections, action.reflectionId);
  const answer = action.answer.trim();
  if (!reflection || reflection.answer !== null || !answer) return state;
  if (!isDayOpen(state, reflection.planDayId)) return state;
  return {
    ...state,
    reflections: withRecord(state.reflections, {
      ...reflection,
      answer,
      answeredAt: action.at,
      updatedAt: action.at,
    }),
  };
}

/**
 * A change to an answer already given — any time after, even once the day
 * is done: reflections are the user's own. Not to empty.
 */
export function updateReflection(state: AppState, action: Action<"reflection/update">): AppState {
  const reflection = findById(state.reflections, action.reflectionId);
  const answer = action.answer.trim();
  if (!reflection || reflection.answer === null || !answer || answer === reflection.answer) {
    return state;
  }
  return {
    ...state,
    reflections: withRecord(state.reflections, { ...reflection, answer, updatedAt: action.at }),
  };
}

/**
 * An answer taken back: the user emptied it, so the question is unanswered
 * again — any time after, like a change. Nothing to clear on one not answered.
 */
export function clearReflection(state: AppState, action: Action<"reflection/clear">): AppState {
  const reflection = findById(state.reflections, action.reflectionId);
  if (!reflection || reflection.answer === null) return state;
  return {
    ...state,
    reflections: withRecord(state.reflections, {
      ...reflection,
      answer: null,
      answeredAt: null,
      updatedAt: action.at,
    }),
  };
}

/** A day's prayer, prayed — once. */
export function markPrayed(state: AppState, action: Action<"prayer/markPrayed">): AppState {
  const prayer = findById(state.prayers, action.prayerId);
  if (!prayer || prayer.prayedAt !== null || !isDayOpen(state, prayer.planDayId)) return state;
  return {
    ...state,
    prayers: withRecord(state.prayers, { ...prayer, prayedAt: action.at, updatedAt: action.at }),
  };
}
