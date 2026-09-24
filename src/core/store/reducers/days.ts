import type { IsoDate, IsoDateTime, PlanDay, StudyStep } from "@/types/domain";

import type { AppAction } from "../actions";
import type { AppState } from "../state";
import { findById, listAll, withRecord } from "../table";
import { canMoveDay } from "../transitions";
import { completed, isStudyable, started, withPlan } from "./plans";

type Action<Type extends AppAction["type"]> = Extract<AppAction, { type: Type }>;

const ALL_STEPS: readonly StudyStep[] = ["read", "scripture", "reflect", "pray"];

/** A day that can be worked on now, with its plan — or null. */
function workableDay(state: AppState, dayId: string) {
  const day = findById(state.planDays, dayId);
  const plan = day ? findById(state.plans, day.planId) : null;
  return day && plan && isStudyable(plan) ? { day, plan } : null;
}

/** The state with `day` in it, and its plan started if it hadn't been. */
function withDay(state: AppState, day: PlanDay, today: IsoDate, at: IsoDateTime): AppState {
  const next = { ...state, planDays: withRecord(state.planDays, day) };
  const plan = findById(next.plans, day.planId);
  return plan ? withPlan(next, plan, started(plan, today, at)) : next;
}

/** An open day, under way. */
export function startPlanDay(state: AppState, action: Action<"planDay/start">): AppState {
  const found = workableDay(state, action.dayId);
  if (!found || !canMoveDay(found.day.status, "inProgress")) return state;
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
  const found = workableDay(state, action.dayId);
  if (!found) return state;
  const { day: before } = found;
  const opening = canMoveDay(before.status, "inProgress");
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
 * worked out from. The next day opens, and the plan completes once every
 * day is done. A locked or already-completed day stays as it is.
 */
export function completePlanDay(
  state: AppState,
  action: Action<"planDay/complete" | "progress/recordDayCompletion">,
): AppState {
  const found = workableDay(state, action.dayId);
  if (!found || !canMoveDay(found.day.status, "completed")) return state;
  const { day: before } = found;
  const day: PlanDay = {
    ...before,
    status: "completed",
    completedSteps: [...ALL_STEPS],
    startedAt: before.startedAt ?? action.at,
    completedAt: action.at,
    updatedAt: action.at,
  };
  let next = withDay(state, day, action.today, action.at);

  const siblings = listAll(next.planDays).filter((other) => other.planId === day.planId);
  const following = siblings.find((other) => other.dayNumber === day.dayNumber + 1);
  if (following && canMoveDay(following.status, "available")) {
    next = {
      ...next,
      planDays: withRecord(next.planDays, {
        ...following,
        status: "available",
        updatedAt: action.at,
      }),
    };
  }

  const plan = findById(next.plans, day.planId);
  const allDone =
    plan !== null &&
    siblings.length === plan.lengthDays &&
    siblings.every((other) => other.status === "completed");
  return plan && allDone ? withPlan(next, plan, completed(plan, action.at)) : next;
}
