import { useLocalSearchParams, useRouter } from "expo-router";

import { parsePlanParams } from "@/entities/plan";
import { usePlanDetail } from "./use-plan-detail";

/**
 * Plan Overview, the page: the plan named in its route (`usePlanDetail`),
 * and Back — to the page it was opened from, in its own tab (Plans, Home,
 * Progress), as iOS's Back does. Every tab's first page sits under it.
 */
export function usePlanOverview() {
  const router = useRouter();
  const planId = parsePlanParams(useLocalSearchParams())?.planId ?? "";
  const detail = usePlanDetail(planId);
  return { ...detail, goBack: () => router.back() };
}
