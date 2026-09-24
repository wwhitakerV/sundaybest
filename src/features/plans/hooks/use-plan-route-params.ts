import { useLocalSearchParams } from "expo-router";

import { getPlanById, getPlanProgress, useAppSelector, type AppState } from "@/core/store";
import { getMockPlan } from "../mock-plans";
import type { Plan } from "../types";

/**
 * A plan from the app store, in this slice's shape. Bridges plans made in
 * New Plan to these screens until they read the store themselves.
 */
function getStorePlan(state: AppState, planId: string): Plan | undefined {
  const plan = getPlanById(state, planId);
  const progress = getPlanProgress(state, planId);
  if (!plan || !progress) return undefined;
  return {
    id: plan.id,
    title: plan.title,
    totalDays: plan.lengthDays,
    currentDay: progress.currentDayNumber,
    completedDays: progress.completedDayNumbers,
    completed: plan.status === "completed",
  };
}

/**
 * The `[planId]` route params every plan screen reads, plus the plan they
 * point at (undefined for an unknown id) — from the app store first, falling
 * back to this slice's own mock plans for the ones only it has. `day` is
 * present on the per-day routes and ignored elsewhere.
 */
export function usePlanRouteParams() {
  const { planId, day } = useLocalSearchParams<{ planId: string; day: string }>();
  const storePlan = useAppSelector((state) => getStorePlan(state, planId));

  return { planId, day, plan: storePlan ?? getMockPlan(planId) };
}
