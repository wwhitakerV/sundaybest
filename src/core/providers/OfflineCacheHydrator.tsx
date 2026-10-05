import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { ZodType } from "zod";

import {
  getMeResponseSchema,
  getPlanResponseSchema,
  getQuizAttemptResponseSchema,
  getRemindersResponseSchema,
  getSettingsResponseSchema,
  getStudyDayResponseSchema,
  listPlansResponseSchema,
  progressResponseSchema,
} from "@/core/api/contracts";
import { apiQueryKeys } from "@/core/api/query-keys";
import { listCachedResources } from "@/core/storage/api-resource-cache";

/**
 * Hydrates only explicitly cached, schema-validated server resources before the
 * application mounts. Cached values are marked stale so an online launch
 * refreshes them in the background without blocking first paint.
 */
export function OfflineCacheHydrator({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const resources = await listCachedResources();
        if (cancelled) return;
        for (const resource of resources) hydrate(queryClient, resource);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  return ready ? children : null;
}

function hydrate(
  queryClient: QueryClient,
  resource: Awaited<ReturnType<typeof listCachedResources>>[number],
): void {
  const target = parseResource(resource.resourceType, resource.cacheKey, resource.payload);
  if (!target) return;
  queryClient.setQueryData(target.queryKey, target.value, { updatedAt: 1 });
}

function parseResource(
  resourceType: string,
  cacheKey: string,
  payload: unknown,
): { queryKey: readonly unknown[]; value: unknown } | null {
  switch (resourceType) {
    case "me":
      return parsed(apiQueryKeys.me, getMeResponseSchema, payload);
    case "settings":
      return parsed(apiQueryKeys.settings, getSettingsResponseSchema, payload);
    case "reminders":
      return parsed(apiQueryKeys.reminders, getRemindersResponseSchema, payload);
    case "plans":
      return parsed(apiQueryKeys.plans, listPlansResponseSchema, payload);
    case "plan": {
      const planId = cacheKey.slice("plan:".length);
      if (!planId) return null;
      return parsed(apiQueryKeys.plan(planId), getPlanResponseSchema, payload);
    }
    case "progress": {
      const weekStart = cacheKey.slice("progress:".length);
      if (!weekStart) return null;
      return parsed(apiQueryKeys.progress(weekStart), progressResponseSchema, payload);
    }
    case "studyDay": {
      const match = /^study:(.+):(\d+)$/.exec(cacheKey);
      if (!match) return null;
      const planId = match[1];
      const dayNumber = Number(match[2]);
      if (!planId || !Number.isInteger(dayNumber)) return null;
      return parsed(apiQueryKeys.studyDay(planId, dayNumber), getStudyDayResponseSchema, payload);
    }
    case "quizSession": {
      const quizId = cacheKey.slice("quiz:".length);
      if (!quizId) return null;
      return parsed(apiQueryKeys.quizSession(quizId), getQuizAttemptResponseSchema, payload);
    }
    default:
      return null;
  }
}

function parsed(
  queryKey: readonly unknown[],
  schema: ZodType,
  payload: unknown,
): { queryKey: readonly unknown[]; value: unknown } | null {
  const result = schema.safeParse(payload);
  return result.success ? { queryKey, value: result.data } : null;
}
