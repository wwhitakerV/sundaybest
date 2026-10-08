import { useMutation, useQueryClient } from "@tanstack/react-query";

import { LOCAL_ANSWERS, LOCAL_ANSWER_COUNTS } from "@/core/storage/reflection-answer-queries";
import { deleteReflectionAnswers } from "@/core/storage/reflection-answers";
import { listPlansResponseSchema } from "./contracts";
import { createIdempotencyKey } from "./idempotency";
import { offlineCacheKeys, persistServerCache } from "./offline-cache";
import { useCurrentUserQuery } from "./reader-queries";
import type { PlansEnvelope } from "./query-cache-sync";
import { apiQueryKeys } from "./query-keys";
import { useSundayBestApi } from "./ApiProvider";

/**
 * Resets a plan for this reader: the server takes it back to not started —
 * days, steps, and Quick Checks cleared — and the answers to its reflection
 * questions kept on this phone are cleared too. What the plan says is never
 * touched. Online only: a reset is never queued for later.
 */
export function useResetPlanMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();
  const userId = useCurrentUserQuery().data?.user.id ?? null;

  return useMutation({
    mutationFn: async (planId: string) => {
      const reset = await api.plans.reset(planId, createIdempotencyKey(`plan:${planId}:reset`));
      if (userId) await deleteReflectionAnswers(userId, reset.reflectionIds);
      return reset;
    },
    onSuccess: ({ plan }) => {
      queryClient.setQueryData<PlansEnvelope>(apiQueryKeys.plans, (current) =>
        current
          ? { plans: current.plans.map((item) => (item.id === plan.id ? plan : item)) }
          : current,
      );
      void persistServerCache({
        cacheKey: offlineCacheKeys.plans,
        resourceType: "plans",
        schema: listPlansResponseSchema,
        value: queryClient.getQueryData<PlansEnvelope>(apiQueryKeys.plans),
      });
      // The plan and its days (keyed under it), its quizzes, and the week's progress.
      void queryClient.invalidateQueries({ queryKey: apiQueryKeys.plan(plan.id) });
      void queryClient.invalidateQueries({ queryKey: ["api", "quizzes"] });
      void queryClient.invalidateQueries({ queryKey: ["api", "quiz-attempts"] });
      void queryClient.invalidateQueries({ queryKey: apiQueryKeys.progressRoot });
      void queryClient.invalidateQueries({ queryKey: LOCAL_ANSWERS });
      void queryClient.invalidateQueries({ queryKey: LOCAL_ANSWER_COUNTS });
    },
  });
}
