import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type CreatePlanRequest,
  type ResolveSermonRequest,
  getPlanResponseSchema,
  listPlansResponseSchema,
} from "./contracts";
import { createIdempotencyKey } from "./idempotency";
import { apiMutationKeys, apiQueryKeys } from "./query-keys";
import { planQueryOptions } from "./query-options";
import { useSundayBestApi } from "./ApiProvider";
import {
  cachedServerQuery,
  isOfflineTransportFailure,
  offlineCacheKeys,
  persistServerCache,
} from "./offline-cache";
import { type PlanEnvelope, type PlansEnvelope, persistPlansCache } from "./query-cache-sync";
import { enqueueMutation } from "@/core/storage/mutation-outbox";

// Plans: the list, one plan, and the writes that make, start, and keep them.

export function usePlansQuery(enabled = true) {
  const api = useSundayBestApi();
  return useQuery({
    queryKey: apiQueryKeys.plans,
    queryFn: () =>
      cachedServerQuery({
        cacheKey: offlineCacheKeys.plans,
        resourceType: "plans",
        schema: listPlansResponseSchema,
        fetcher: () => api.plans.list(),
      }),
    enabled,
  });
}

export function usePlanQuery(planId: string) {
  const api = useSundayBestApi();
  return useQuery({ ...planQueryOptions(api, planId), enabled: planId.length > 0 });
}

export function useResolveSermonMutation() {
  const api = useSundayBestApi();

  return useMutation({
    mutationFn: (input: ResolveSermonRequest) =>
      api.sermons.resolve(input, createIdempotencyKey(`sermon:resolve:${input.url}`)),
  });
}

export function useCreatePlanMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    // Watched by the generation bar, which shows the plan until the server has it.
    mutationKey: apiMutationKeys.createPlan,
    mutationFn: (input: CreatePlanRequest) =>
      api.plans.create(
        input,
        createIdempotencyKey(
          `plan:create:${input.sermonId}:${input.lengthDays}:${input.quickCheckEnabled ? "quiz" : "no-quiz"}`,
        ),
      ),
    // Settles only once the bar's list has the new build, so the bar goes
    // straight from "asked for" to building, with nothing in between.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.plans }),
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.currentGenerations }),
      ]),
  });
}

export function useStartPlanMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) =>
      api.plans.start(planId, createIdempotencyKey(`plan:${planId}:start`)),
    onSuccess: ({ plan }) => {
      queryClient.setQueryData<PlanEnvelope>(apiQueryKeys.plan(plan.id), { plan });
      queryClient.setQueryData<PlansEnvelope>(apiQueryKeys.plans, (current) =>
        current
          ? { plans: current.plans.map((item) => (item.id === plan.id ? plan : item)) }
          : current,
      );
      void persistServerCache({
        cacheKey: offlineCacheKeys.plan(plan.id),
        resourceType: "plan",
        schema: getPlanResponseSchema,
        value: { plan },
        serverUpdatedAt: plan.updatedAt,
      });
      void persistPlansCache(queryClient);
      void queryClient.invalidateQueries({ queryKey: apiQueryKeys.progressRoot });
    },
  });
}

export function useSetPlanSavedMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, saved }: { planId: string; saved: boolean }) => {
      const idempotencyKey = createIdempotencyKey(`plan:${planId}:${saved ? "save" : "unsave"}`);
      try {
        return saved
          ? await api.plans.save(planId, idempotencyKey)
          : await api.plans.removeSaved(planId, idempotencyKey);
      } catch (cause) {
        if (!isOfflineTransportFailure(cause)) throw cause;
        await enqueueMutation({
          kind: "plan.setSaved",
          entityKey: planId,
          payload: { planId, saved },
          idempotencyKey,
        });
        return { saved };
      }
    },
    onMutate: async ({ planId, saved }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: apiQueryKeys.plans }),
        queryClient.cancelQueries({ queryKey: apiQueryKeys.plan(planId) }),
      ]);
      const previousPlans = queryClient.getQueryData<PlansEnvelope>(apiQueryKeys.plans);
      const previousPlan = queryClient.getQueryData<PlanEnvelope>(apiQueryKeys.plan(planId));
      queryClient.setQueryData<PlansEnvelope>(apiQueryKeys.plans, (current) =>
        current
          ? { plans: current.plans.map((item) => (item.id === planId ? { ...item, saved } : item)) }
          : current,
      );
      queryClient.setQueryData<PlanEnvelope>(apiQueryKeys.plan(planId), (current) =>
        current ? { plan: { ...current.plan, saved } } : current,
      );
      return { previousPlans, previousPlan, planId };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      if (context.previousPlans)
        queryClient.setQueryData(apiQueryKeys.plans, context.previousPlans);
      if (context.previousPlan)
        queryClient.setQueryData(apiQueryKeys.plan(context.planId), context.previousPlan);
    },
    onSuccess: () => {
      void persistPlansCache(queryClient);
    },
  });
}
