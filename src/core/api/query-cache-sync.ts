import type { QueryClient } from "@tanstack/react-query";
import {
  type ApiPlanDetail,
  type ApiPlanSummary,
  type ApiReminder,
  type ApiStudyDay,
  type ApiUser,
  type ApiUserSettings,
  getPlanResponseSchema,
  getStudyDayResponseSchema,
  listPlansResponseSchema,
} from "./contracts";
import { apiQueryKeys } from "./query-keys";
import { offlineCacheKeys, persistServerCache } from "./offline-cache";
import { removeCachedResource } from "@/core/storage/api-resource-cache";

/**
 * Keeping TanStack's cache, and the device's offline copy of it, in step after
 * a write: the envelopes the API answers with, and the shared updates the
 * plan, study, and quiz writes make.
 */
export type MeEnvelope = { user: ApiUser };
export type SettingsEnvelope = { settings: ApiUserSettings };
export type RemindersEnvelope = { reminders: ApiReminder[] };
export type PlansEnvelope = { plans: ApiPlanSummary[] };
export type PlanEnvelope = { plan: ApiPlanDetail };
export type StudyDayEnvelope = { day: ApiStudyDay };

export function toPlanSummary(plan: ApiPlanDetail): ApiPlanSummary {
  const { days: _days, ...summary } = plan;
  return summary;
}

export async function invalidateStudySurfaces(
  queryClient: QueryClient,
  planId?: string,
): Promise<void> {
  const work = [
    queryClient.invalidateQueries({ queryKey: apiQueryKeys.plans }),
    queryClient.invalidateQueries({ queryKey: apiQueryKeys.progressRoot }),
  ];
  if (planId) {
    work.push(queryClient.invalidateQueries({ queryKey: apiQueryKeys.plan(planId) }));
  }
  await Promise.all(work);
}

export async function persistPlansCache(queryClient: QueryClient): Promise<void> {
  await persistServerCache({
    cacheKey: offlineCacheKeys.plans,
    resourceType: "plans",
    schema: listPlansResponseSchema,
    value: queryClient.getQueryData<PlansEnvelope>(apiQueryKeys.plans),
  });
}

export async function persistStudyCaches(
  queryClient: QueryClient,
  planId: string,
  dayNumber: number,
): Promise<void> {
  const study = queryClient.getQueryData<StudyDayEnvelope>(
    apiQueryKeys.studyDay(planId, dayNumber),
  );
  const studyPersistence = study?.day.scripture.cacheAllowed
    ? persistServerCache({
        cacheKey: offlineCacheKeys.studyDay(planId, dayNumber),
        resourceType: "studyDay",
        schema: getStudyDayResponseSchema,
        value: study,
      })
    : removeCachedResource(offlineCacheKeys.studyDay(planId, dayNumber));

  await Promise.all([
    studyPersistence,
    persistServerCache({
      cacheKey: offlineCacheKeys.plan(planId),
      resourceType: "plan",
      schema: getPlanResponseSchema,
      value: queryClient.getQueryData<PlanEnvelope>(apiQueryKeys.plan(planId)),
    }),
    persistPlansCache(queryClient),
  ]);
}
