import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  offlineCacheKeys,
  persistServerCache,
} from "./offline-cache";
import { type PlanEnvelope, type PlansEnvelope, persistPlansCache } from "./query-cache-sync";

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

/** How long a search's answer is fresh, and how long it's kept for the same words again. */
const SEARCH_FRESH_MS = 30_000;
const SEARCH_KEPT_MS = 5 * 60_000;

/**
 * A search of the reader's plans by its words, once they settle (the caller
 * debounces them). The last answer stays while the next is out, so results
 * never blank between searches, and a search gone stale is cancelled. Kept
 * briefly: a plan that changes shows changed the next time it's searched.
 */
export function usePlanSearchQuery(words: string) {
  const api = useSundayBestApi();
  return useQuery({
    queryKey: apiQueryKeys.planSearch(words),
    queryFn: ({ signal }) => api.plans.search(words, signal),
    enabled: words.length > 0,
    placeholderData: keepPreviousData,
    staleTime: SEARCH_FRESH_MS,
    gcTime: SEARCH_KEPT_MS,
    // A search that fails says so at once; the reader's next keystroke is the retry.
    retry: false,
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

