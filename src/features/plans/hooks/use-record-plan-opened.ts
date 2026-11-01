import { useEffect } from "react";

import { useMarkPlanOpened } from "@/core/storage/plan-opened-queries";

/** The plan, recorded as opened on this phone as its page appears: what Plans leads with. */
export function useRecordPlanOpened(planId: string) {
  const markOpened = useMarkPlanOpened();
  useEffect(() => {
    if (planId) markOpened(planId);
  }, [planId, markOpened]);
}
