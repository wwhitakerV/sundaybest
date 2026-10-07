import { useMutation, useMutationState, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createPlanRequestSchema,
  createPlanResponseSchema,
  type ApiPlanGeneration,
  type CreatePlanRequest,
} from "./contracts";
import { useSundayBestApi } from "./ApiProvider";
import { createIdempotencyKey } from "./idempotency";
import { apiMutationKeys, apiQueryKeys } from "./query-keys";

/** How often the bar asks how a build is going, while one is. */
const BUILDING_POLL_MS = 2000;

function isBuilding(generation: ApiPlanGeneration): boolean {
  return generation.status !== "completed" && generation.status !== "failed";
}

/**
 * The reader's builds not yet dismissed — building, ready, or failed — newest
 * first. Asked again every two seconds while any is still building, and not
 * at all once none is. When a build it was watching finishes, the plan list
 * is fetched again: it was last fetched when the build was asked for, before
 * the plan was ready, so it doesn't have it yet.
 */
export function useCurrentGenerationsQuery() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: apiQueryKeys.currentGenerations,
    queryFn: async () => {
      const watched = new Set(
        (queryClient.getQueryData<ApiPlanGeneration[]>(apiQueryKeys.currentGenerations) ?? [])
          .filter(isBuilding)
          .map((generation) => generation.id),
      );
      const { generations } = await api.generations.current();
      const finished = generations.some(
        (generation) => watched.has(generation.id) && generation.status === "completed",
      );
      if (finished) void queryClient.invalidateQueries({ queryKey: apiQueryKeys.plans });
      return generations;
    },
    refetchInterval: (query) => (query.state.data?.some(isBuilding) ? BUILDING_POLL_MS : false),
  });
}

/**
 * Takes a build out of the bar at once; it keeps building on the server. If
 * the server refuses, it comes back.
 */
export function useDismissGenerationMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();
  const key = apiQueryKeys.currentGenerations;

  return useMutation({
    mutationFn: (generationId: string) =>
      api.generations.dismiss(
        generationId,
        createIdempotencyKey(`generation:${generationId}:dismiss`),
      ),
    onMutate: async (generationId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ApiPlanGeneration[]>(key);
      queryClient.setQueryData<ApiPlanGeneration[]>(key, (current) =>
        current?.filter((generation) => generation.id !== generationId),
      );
      return { previous };
    },
    onError: (_error, _generationId, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
  });
}

/** Builds a failed plan again; the bar shows it building once the server agrees. */
export function useRetryGenerationMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (generationId: string) =>
      api.generations.retry(generationId, createIdempotencyKey(`generation:${generationId}:retry`)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: apiQueryKeys.currentGenerations }),
  });
}

/** A plan asked for that the server hasn't confirmed: still sending, or failed to send. */
export type PlanStart = { key: string; failed: boolean; request: CreatePlanRequest };

/** A plan asked for that the server has: the build it started. */
export type LandedStart = { key: string; generationId: string };

/**
 * Plans asked for whose requests haven't finished — kept by the query
 * client's mutation cache, so they outlive the New Plan modal that sent them.
 * A start that failed stays until it's tried again or forgotten; one that
 * landed is listed with its build until forgotten.
 */
export function usePlanStarts() {
  const queryClient = useQueryClient();
  const starts = useMutationState({
    filters: {
      mutationKey: apiMutationKeys.createPlan,
      predicate: (mutation) => mutation.state.status !== "success",
    },
    select: (mutation): PlanStart | null => {
      const request = createPlanRequestSchema.safeParse(mutation.state.variables);
      return request.success
        ? {
            key: String(mutation.mutationId),
            failed: mutation.state.status === "error",
            request: request.data,
          }
        : null;
    },
  }).filter((start) => start !== null);
  const landed = useMutationState({
    filters: { mutationKey: apiMutationKeys.createPlan, status: "success" },
    select: (mutation): LandedStart | null => {
      const created = createPlanResponseSchema.safeParse(mutation.state.data);
      return created.success
        ? { key: String(mutation.mutationId), generationId: created.data.generationId }
        : null;
    },
  }).filter((start) => start !== null);

  /** Drops a start from the bar, sent or not. */
  function forget(key: string) {
    const mutation = queryClient
      .getMutationCache()
      .getAll()
      .find((candidate) => String(candidate.mutationId) === key);
    if (mutation) queryClient.getMutationCache().remove(mutation);
  }

  return { starts, landed, forget };
}
