import { useEffect } from "react";

import {
  useCurrentGenerationsQuery,
  useDismissGenerationMutation,
} from "@/core/api/generation-queries";

/**
 * Opening a plan that the generation bar is showing as ready takes it off
 * the bar: the reader has found it. A plan still being built, or another
 * plan's ready build, is left where it is.
 */
export function useClearReadyBuild(planId: string) {
  const current = useCurrentGenerationsQuery();
  const { mutate: dismiss } = useDismissGenerationMutation();
  const readyId = current.data?.find(
    (generation) => generation.planId === planId && generation.status === "completed",
  )?.id;

  useEffect(() => {
    if (readyId) dismiss(readyId);
  }, [readyId, dismiss]);
}
