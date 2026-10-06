import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useSundayBestApi } from "./ApiProvider";
import { planQueryOptions, studyDayQueryOptions } from "./query-options";

/**
 * Warms what the reader is about to open, so the screen they tap through to
 * arrives with its content rather than a skeleton. Fresh data isn't fetched
 * again, and a failure is the screen's to show when it opens, never here.
 */
export function usePrefetch() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMemo(
    () => ({
      plan: (planId: string) => void queryClient.prefetchQuery(planQueryOptions(api, planId)),
      studyDay: (planId: string, dayNumber: number) =>
        void queryClient.prefetchQuery(studyDayQueryOptions(api, planId, dayNumber)),
    }),
    [api, queryClient],
  );
}
