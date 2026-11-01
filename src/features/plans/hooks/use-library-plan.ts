import { useRouter } from "expo-router";

import type { ApiPlanSummary } from "@/core/api/contracts";
import { usePlanQuery } from "@/core/api/plan-queries";
import { seriesLine } from "@/entities/sermon";
import { placePlanHref } from "@/entities/tabs";
import { describeFolio, describeIssue } from "../logic/plan-library";

/**
 * One plan on a library shelf: its artwork, title and series, its folio — its
 * church, its Scripture once its own page has arrived, and when it was
 * finished — its days while it's unfinished, and the plan, opened in Plans'
 * own stack.
 */
export function useLibraryPlan(plan: ApiPlanSummary) {
  const router = useRouter();
  const detail = usePlanQuery(plan.id).data?.plan ?? null;
  const passage = detail ? describeIssue(detail).passage : null;
  return {
    title: plan.title,
    series: seriesLine(plan.sermon),
    thumbnailUrl: plan.sermon.thumbnailUrl,
    folio: describeFolio(plan, passage),
    days:
      plan.status === "completed"
        ? null
        : { total: plan.lengthDays, done: plan.progress.completedDays },
    open: () => router.push(placePlanHref("plans", plan.id)),
  };
}
