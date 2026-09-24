import type { Id, Plan, PlanDay } from "@/types/domain";

import { compareIso } from "../dates";
import type { AppState } from "../state";
import { findById, listAll } from "../table";

/** Newest first. */
function byNewest(a: Plan, b: Plan): number {
  return compareIso(b.createdAt, a.createdAt);
}

/** Every plan, newest first. */
export function getPlans(state: AppState): Plan[] {
  return listAll(state.plans).sort(byNewest);
}

export function getPlanById(state: AppState, planId: Id): Plan | null {
  return findById(state.plans, planId);
}

/**
 * The plans the user has — built ones, not drafts, plans still being built,
 * or ones put away — newest first. The sample counts once they've started it.
 */
export function getUserPlans(state: AppState): Plan[] {
  return getPlans(state).filter((plan) => {
    if (plan.isSample) return plan.status === "active" || plan.status === "completed";
    return plan.status === "ready" || plan.status === "active" || plan.status === "completed";
  });
}

/** The sample plan anyone can try, if there is one. */
export function getSamplePlan(state: AppState): Plan | null {
  return listAll(state.plans).find((plan) => plan.isSample) ?? null;
}

/** Plans under way, most recently started first. */
export function getInProgressPlans(state: AppState): Plan[] {
  return listAll(state.plans)
    .filter((plan) => plan.status === "active")
    .sort((a, b) => compareIso(b.startedAt ?? "", a.startedAt ?? ""));
}

/** The plan the user is on: the most recently started one under way, if any. */
export function getActivePlan(state: AppState): Plan | null {
  return getInProgressPlans(state).at(0) ?? null;
}

/** Finished plans, most recently finished first. */
export function getCompletedPlans(state: AppState): Plan[] {
  return listAll(state.plans)
    .filter((plan) => plan.status === "completed")
    .sort((a, b) => compareIso(b.completedAt ?? "", a.completedAt ?? ""));
}

/** A plan's days, day 1 first. */
export function getPlanDays(state: AppState, planId: Id): PlanDay[] {
  return listAll(state.planDays)
    .filter((day) => day.planId === planId)
    .sort((a, b) => a.dayNumber - b.dayNumber);
}

export function getPlanDay(state: AppState, planId: Id, dayNumber: number): PlanDay | null {
  return getPlanDays(state, planId).find((day) => day.dayNumber === dayNumber) ?? null;
}

export function getPlanDayById(state: AppState, dayId: Id): PlanDay | null {
  return findById(state.planDays, dayId);
}

/**
 * The day the user is on: the first one not yet finished — or, once every
 * day is, the last. Null for a plan with no days yet.
 */
export function getCurrentPlanDay(state: AppState, planId: Id): PlanDay | null {
  const days = getPlanDays(state, planId);
  return days.find((day) => day.status !== "completed") ?? days.at(-1) ?? null;
}
