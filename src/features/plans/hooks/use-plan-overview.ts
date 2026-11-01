import { useLocalSearchParams, useRouter } from "expo-router";

import { parsePlanParams } from "@/entities/plan";
import { usePlanDetail } from "./use-plan-detail";
import { useRecordPlanOpened } from "./use-record-plan-opened";

/**
 * Plan Overview, the page: the plan named in its route (`usePlanDetail`),
 * and Back — to the page it was opened from, in its own tab (Plans, Home,
 * Progress), as iOS's Back does. Every tab's first page sits under it.
 * Opened, it's recorded as the plan the reader was in last.
 */
export function usePlanOverview() {
  const router = useRouter();
  const planId = parsePlanParams(useLocalSearchParams())?.planId ?? "";
  const detail = usePlanDetail(planId);
  useRecordPlanOpened(planId);
  return { ...detail, goBack: () => router.back() };
}
