import { useLocalSearchParams } from "expo-router";

import { usePlanQuery } from "@/core/api/plan-queries";
import { useStudyDayQuery } from "@/core/api/study-queries";
import { parseStudyParams } from "@/entities/plan";

/**
 * The server-backed Daily Study route. The API is authoritative for whether a
 * day is reachable; a future/blocked day returns an API error rather than being
 * recreated from client-side scheduling rules.
 */
export function useStudyRoute() {
  const params = parseStudyParams(useLocalSearchParams());
  const planId = params?.planId ?? "";
  const dayNumber = params?.dayNumber ?? 0;
  const planQuery = usePlanQuery(planId);
  const dayQuery = useStudyDayQuery(planId, dayNumber);

  return {
    planId,
    dayNumber,
    requestedStep: params?.step ?? null,
    plan: planQuery.data?.plan ?? null,
    day: dayQuery.data?.day ?? null,
    loading: Boolean(params) && (planQuery.isPending || dayQuery.isPending),
    error: planQuery.error ?? dayQuery.error ?? null,
    refetch: async () => {
      await Promise.all([planQuery.refetch(), dayQuery.refetch()]);
    },
  } as const;
}
