import { usePreventZoomTransitionDismissal, useRouter } from "expo-router";

import { useQuickChecksQuery } from "@/core/api/reader-queries";
import { quickCheckHref } from "@/entities/plan";
import { groupQuickChecks } from "../logic/recall";

/**
 * The list of every Quick Check finished, full screen: under their plans,
 * newest first, each its passage, day and how many it held. A row opens
 * that Quick Check's results. Only its close leaves.
 */
export function useQuickChecksList() {
  const router = useRouter();
  const query = useQuickChecksQuery();
  // No swipe down — the zoom's own included — ever dismisses it.
  usePreventZoomTransitionDismissal({ unstable_dismissalBoundsRect: { maxX: 0, maxY: 0 } });

  return {
    loading: query.isPending,
    error: query.data === undefined ? query.error : null,
    retry: () => void query.refetch(),
    plans: groupQuickChecks(query.data?.quickChecks ?? []),
    open: (planId: string, dayNumber: number) => router.push(quickCheckHref(planId, dayNumber)),
    close: () => router.back(),
  } as const;
}
