import { useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { isApiError } from "@/core/api/api-error";
import {
  usePlanGenerationQuery,
  useRetryPlanGenerationMutation,
} from "@/core/api/queries";
import { apiQueryKeys } from "@/core/api/query-keys";
import { useModalSession } from "@/hooks/use-modal-session";
import {
  errorFeedback,
  successFeedback,
  tapFeedback,
} from "@/core/haptics/haptics";
import { planReadyHref } from "../logic/routes";

/** Preparing is now a live view of the server-side generation job. */
export function usePreparingPlan() {
  const router = useRouter();
  const session = useModalSession();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    planId?: string | string[];
    generationId?: string | string[];
  }>();

  const planId = firstParam(params.planId);
  const generationId = firstParam(params.generationId);
  const generationQuery = usePlanGenerationQuery(generationId);
  const retryGeneration = useRetryPlanGenerationMutation(generationId);
  const handledSettlement = useRef<string | null>(null);

  const generation = generationQuery.data?.generation ?? null;
  const status = generation?.status ?? "preparing";
  const noCaptions =
    generation?.status === "failed" &&
    generation.error?.code === "noCaptions";

  useEffect(() => {
    if (!generation) return;

    const settlementKey = `${generation.id}:${generation.attempt}:${generation.status}`;
    if (handledSettlement.current === settlementKey) return;

    if (generation.status === "completed") {
      handledSettlement.current = settlementKey;
      successFeedback();
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.plans }),
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.plan(planId) }),
      ]);
      router.replace(planReadyHref(planId));
      return;
    }

    if (generation.status === "failed") {
      handledSettlement.current = settlementKey;
      errorFeedback();
      if (noCaptions) router.back();
    }
  }, [generation, noCaptions, planId, queryClient, router]);

  const routeValid = planId.length > 0 && generationId.length > 0;
  const missing =
    generationQuery.isError &&
    isApiError(generationQuery.error) &&
    generationQuery.error.code === "NOT_FOUND";

  const generationFailure =
    generation?.status === "failed" && !noCaptions
      ? generation.error
      : null;

  const requestFailure =
    generationQuery.isError && !missing
      ? {
          code: "network" as const,
          message: "We couldn’t check your plan right now.",
        }
      : null;

  return {
    found: routeValid && !missing,
    loading: generationQuery.isPending,
    plan: generation
      ? {
          id: generation.planId,
          title: generation.planTitle,
          lengthDays: generation.requestedLength,
          quickCheckEnabled: generation.quickCheckEnabled,
        }
      : null,
    status,
    failure: generationFailure ?? requestFailure,
    retry: () => {
      tapFeedback();
      if (generation?.status === "failed") {
        retryGeneration.mutate();
      } else {
        void generationQuery.refetch();
      }
    },
    retrying: retryGeneration.isPending || generationQuery.isFetching,
    close: session.exit,
  } as const;
}

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}
