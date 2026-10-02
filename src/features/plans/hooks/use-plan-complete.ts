import { useLocalSearchParams } from "expo-router";

import { NEW_PLAN_HREF, parsePlanParams, planOverviewHref } from "@/entities/plan";
import { useModalSession } from "@/hooks/use-modal-session";
import { tapFeedback } from "@/core/haptics/haptics";
import { getPlanSummary, useAppSelector } from "@/core/store";

/**
 * Plan Complete's view model: what the plan added up to — its days, the
 * reflections written, its Quick Checks' score — and the ways on: back to
 * the plan, or on to next week's sermon. Both leave the study session.
 */
export function usePlanComplete() {
  const session = useModalSession();
  const planId = parsePlanParams(useLocalSearchParams())?.planId ?? "";
  const summary = useAppSelector((state) => getPlanSummary(state, planId));

  if (!summary) return { found: false } as const;

  return {
    found: true,
    summary,
    close: () => session.exitTo(planOverviewHref(planId)),
    addSermon: () => {
      tapFeedback();
      session.exitTo(NEW_PLAN_HREF);
    },
  } as const;
}
