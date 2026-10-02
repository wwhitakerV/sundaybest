import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { parsePlanParams } from "@/entities/plan";
import { useModalSession } from "@/hooks/use-modal-session";
import { errorFeedback, successFeedback, tapFeedback } from "@/core/haptics/haptics";
import {
  getPlanById,
  getPlanGeneration,
  isGeneratingPlan,
  useAppSelector,
  useStoreActions,
} from "@/core/store";
import { planReadyHref } from "../logic/routes";

/**
 * Preparing's view model: how the route's plan's build is going. A draft
 * whose build hasn't started — another plan was being built when it was made
 * — starts as soon as the builder is free. Once it's built it hands on to
 * Plan Ready; if the video has no captions it hands back to New Plan, which
 * says so. Any other failure is the screen's to show, with Try again.
 */
export function usePreparingPlan() {
  const router = useRouter();
  const session = useModalSession();
  const planId = parsePlanParams(useLocalSearchParams())?.planId ?? "";
  const plan = useAppSelector((state) => getPlanById(state, planId));
  const busy = useAppSelector(isGeneratingPlan);
  const storeGeneration = useAppSelector(getPlanGeneration);
  const generation = storeGeneration?.planId === planId ? storeGeneration : null;
  const { startPlanGeneration, retryPlanGeneration } = useStoreActions();

  const status = generation?.status ?? "idle";
  const failure = status === "failed" ? (generation?.error ?? null) : null;
  const noCaptions = failure?.code === "noCaptions";

  useEffect(() => {
    if (plan?.status === "draft" && !generation && !busy) startPlanGeneration(plan.id);
  }, [plan, generation, busy, startPlanGeneration]);

  // Where the build lands — felt as well as seen: a success as it hands on to
  // Plan Ready; an error when it couldn't be built, whether shown here or (no
  // captions) back on New Plan.
  useEffect(() => {
    if (status === "completed") {
      successFeedback();
      router.replace(planReadyHref(planId));
    } else if (status === "failed") {
      errorFeedback();
      if (noCaptions) router.back();
    }
  }, [status, noCaptions, planId, router]);

  return {
    /** Whether the route names a plan that exists. */
    found: plan !== null,
    plan,
    status,
    /** A failure the screen shows — not a missing-captions one, which New Plan shows. */
    failure: noCaptions ? null : failure,
    retry: () => {
      tapFeedback();
      retryPlanGeneration();
    },
    close: session.exit,
  };
}
