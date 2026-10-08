import type { IsoDate, IsoDateTime, PlanDay, StudyStep } from "@/types/domain";

import type { AppAction } from "../actions";
import type { AppState } from "../state";
import { findById, listAll, withRecord } from "../table";
import { canMoveDay } from "../transitions";
import { completed, isStudyable, startPlan, withPlan } from "./plans";

type Action<Type extends AppAction["type"]> = Extract<AppAction, { type: Type }>;

const ALL_STEPS: readonly StudyStep[] = ["read", "scripture", "reflect", "pray"];

/** Whether every earlier day is done — a user cannot skip ahead just because its date arrived. */
function earlierDaysDone(state: AppState, day: PlanDay): boolean {
  return listAll(state.planDays)
    .filter((candidate) => candidate.planId === day.planId && candidate.dayNumber < day.dayNumber)
    .every((candidate) => candidate.status === "completed");
}

/** A locked day becomes workable only on/after its schedule and after every earlier day. */
function isOpenToday(state: AppState, day: PlanDay, today: IsoDate): boolean {
  if (day.status !== "locked") return true;
  return day.scheduledOn !== null && day.scheduledOn <= today && earlierDaysDone(state, day);
}

/** A day that can be worked on now, with its plan — or null. */
function workableDay(state: AppState, dayId: string, today: IsoDate) {
  const day = findById(state.planDays, dayId);
  const plan = day ? findById(state.plans, day.planId) : null;
  return day && plan && isStudyable(plan) && isOpenToday(state, day, today) ? { day, plan } : null;
}

/** The state with `day` in it, and its plan started/scheduled if it hadn't been. */
function withDay(state: AppState, day: PlanDay, today: IsoDate, at: IsoDateTime): AppState {
  const next = { ...state, planDays: withRecord(state.planDays, day) };
  const plan = findById(next.plans, day.planId);
  return plan ? startPlan(next, { type: "plan/start", planId: plan.id, today, at }) : next;
}

/** An open day, under way. */
export function startPlanDay(state: AppState, action: Action<"planDay/start">): AppState {
  const found = workableDay(state, action.dayId, action.today);
  if (!found) return state;
  const canOpen = canMoveDay(found.day.status, "inProgress") || found.day.status === "locked";
  if (!canOpen) return state;
  const day: PlanDay = {
    ...found.day,
    status: "inProgress",
    startedAt: found.day.startedAt ?? action.at,
    updatedAt: action.at,
  };
  return withDay(state, day, action.today, action.at);
}

/** One of a day's steps done — starting the day if it wasn't yet. Each step once. */
export function updatePlanDay(state: AppState, action: Action<"planDay/update">): AppState {
  const found = workableDay(state, action.dayId, action.today);
  if (!found) return state;
  const { day: before } = found;
  const opening = canMoveDay(before.status, "inProgress") || before.status === "locked";
  if (!opening && before.status !== "inProgress") return state;
  if (before.completedSteps.includes(action.completedStep)) return state;
  const day: PlanDay = {
    ...before,
    status: "inProgress",
    completedSteps: [...before.completedSteps, action.completedStep],
    startedAt: before.startedAt ?? action.at,
    updatedAt: action.at,
  };
  return withDay(state, day, action.today, action.at);
}

/**
 * A day finished — once. That's its completion record, which progress is
 * worked out from. The next day stays date-gated, and the plan completes
 * once every day is done. A locked or already-completed day stays as it is.
 */
export function completePlanDay(
  state: AppState,
  action: Action<"planDay/complete" | "progress/recordDayCompletion">,
): AppState {
  const found = workableDay(state, action.dayId, action.today);
  if (!found || !canMoveDay(found.day.status, "completed")) return state;
  const { day: before, plan } = found;
  if (!ALL_STEPS.every((step) => before.completedSteps.includes(step))) return state;
  const quiz = listAll(state.quizzes).find((candidate) => candidate.planDayId === before.id);
  if (quiz) {
    const quizDone = listAll(state.quizAttempts).some(
      (attempt) => attempt.quizId === quiz.id && attempt.status === "completed",
    );
    if (!quizDone) return state;
  }
  const day: PlanDay = {
    ...before,
    status: "completed",
    completedSteps: [...ALL_STEPS],
    startedAt: before.startedAt ?? action.at,
    completedAt: action.at,
    updatedAt: action.at,
  };
  const next = withDay(state, day, action.today, action.at);

  const siblings = listAll(next.planDays).filter((other) => other.planId === day.planId);
  const allDone =
    siblings.length === plan.lengthDays && siblings.every((other) => other.status === "completed");
  return allDone ? withPlan(next, plan, completed(plan, action.at)) : next;
}
