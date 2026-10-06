import type { SundayBestApi } from "./ApiProvider";
import { getPlanResponseSchema, getStudyDayResponseSchema } from "./contracts";
import { cachedServerQuery, offlineCacheKeys } from "./offline-cache";
import { apiQueryKeys } from "./query-keys";

/**
 * How a plan and a study day are fetched, in one place: the screens' queries
 * and the prefetches that warm them must fetch alike, or a prefetched answer
 * would differ from what the screen asks for.
 */
export function planQueryOptions(api: SundayBestApi, planId: string) {
  return {
    queryKey: apiQueryKeys.plan(planId),
    queryFn: () =>
      cachedServerQuery({
        cacheKey: offlineCacheKeys.plan(planId),
        resourceType: "plan",
        schema: getPlanResponseSchema,
        fetcher: () => api.plans.get(planId),
        serverUpdatedAt: (value) => value.plan.updatedAt,
      }),
  };
}

export function studyDayQueryOptions(api: SundayBestApi, planId: string, dayNumber: number) {
  return {
    queryKey: apiQueryKeys.studyDay(planId, dayNumber),
    queryFn: () =>
      cachedServerQuery({
        cacheKey: offlineCacheKeys.studyDay(planId, dayNumber),
        resourceType: "studyDay",
        schema: getStudyDayResponseSchema,
        fetcher: () => api.study.getDay(planId, dayNumber),
        cacheable: (value) => value.day.scripture.cacheAllowed,
      }),
  };
}
