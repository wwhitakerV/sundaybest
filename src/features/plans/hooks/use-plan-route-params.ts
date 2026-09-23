import { useLocalSearchParams } from "expo-router";

import { getMockPlan } from "../mock-plans";

/**
 * The `[planId]` route params every plan screen reads, plus the plan they
 * point at (undefined for an unknown id). `day` is present on the per-day
 * routes and ignored elsewhere.
 */
export function usePlanRouteParams() {
  const { planId, day } = useLocalSearchParams<{ planId: string; day: string }>();

  return { planId, day, plan: getMockPlan(planId) };
}
