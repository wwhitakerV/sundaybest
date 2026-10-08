import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiPlanDetail } from "./contracts";
import { createIdempotencyKey } from "./idempotency";
import { apiQueryKeys } from "./query-keys";
import { studyDayQueryOptions } from "./query-options";
import { useSundayBestApi } from "./ApiProvider";
import { isOfflineTransportFailure } from "./offline-cache";
import {
  type PlanEnvelope,
  type PlansEnvelope,
  type StudyDayEnvelope,
  invalidateStudySurfaces,
  persistPlansCache,
  persistStudyCaches,
  toPlanSummary,
} from "./query-cache-sync";
import { enqueueMutation } from "@/core/storage/mutation-outbox";

// The Daily Study: a day's content, and the writes that record its steps and finish it.

export function useStudyDayQuery(planId: string, dayNumber: number) {
  const api = useSundayBestApi();
  return useQuery({
    ...studyDayQueryOptions(api, planId, dayNumber),
    enabled: planId.length > 0 && dayNumber > 0,
  });
}

export function useCompleteStudyStepMutation(planId: string, dayNumber: number) {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (step: "read" | "scripture" | "reflect" | "pray") => {
      const idempotencyKey = createIdempotencyKey(`study:${planId}:${dayNumber}:${step}`);
      try {
        return await api.study.completeStep(planId, dayNumber, step, idempotencyKey);
      } catch (cause) {
        if (!isOfflineTransportFailure(cause)) throw cause;
        await enqueueMutation({
          kind: "study.completeStep",
          entityKey: `${planId}:${dayNumber}`,
          payload: { planId, dayNumber, step },
          idempotencyKey,
        });
        const current = queryClient.getQueryData<StudyDayEnvelope>(
          apiQueryKeys.studyDay(planId, dayNumber),
        );
        const completed = new Set(current?.day.progress.completedSteps ?? []);
        completed.add(step);
        const order = ["read", "scripture", "reflect", "pray"] as const;
        return {
          completedSteps: order.filter((candidate) => completed.has(candidate)),
          updatedAt: new Date().toISOString(),
        };
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData<StudyDayEnvelope>(
        apiQueryKeys.studyDay(planId, dayNumber),
        (current) =>
          current
            ? {
                day: {
                  ...current.day,
                  progress: {
                    ...current.day.progress,
                    status:
                      current.day.progress.status === "completed" ? "completed" : "inProgress",
                    completedSteps: data.completedSteps,
                    startedAt: current.day.progress.startedAt ?? data.updatedAt,
                  },
                },
              }
            : current,
      );
      queryClient.setQueryData<PlanEnvelope>(apiQueryKeys.plan(planId), (current) => {
        if (!current) return current;
        return {
          plan: {
            ...current.plan,
            days: current.plan.days.map((day) =>
              day.dayNumber === dayNumber
                ? {
                    ...day,
                    progress: {
                      ...day.progress,
                      status: day.progress.status === "completed" ? "completed" : "inProgress",
                      completedSteps: data.completedSteps,
                      startedAt: day.progress.startedAt ?? data.updatedAt,
                    },
                  }
                : day,
            ),
          },
        };
      });
      void persistStudyCaches(queryClient, planId, dayNumber);
      void invalidateStudySurfaces(queryClient, planId);
    },
  });
}

export function useCompleteStudyDayMutation(planId: string, dayNumber: number) {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const idempotencyKey = createIdempotencyKey(`study:${planId}:${dayNumber}:complete`);
      try {
        return await api.study.completeDay(planId, dayNumber, idempotencyKey);
      } catch (cause) {
        if (!isOfflineTransportFailure(cause)) throw cause;
        await enqueueMutation({
          kind: "study.completeDay",
          entityKey: `${planId}:${dayNumber}`,
          payload: { planId, dayNumber },
          idempotencyKey,
        });
        const plan = queryClient.getQueryData<PlanEnvelope>(apiQueryKeys.plan(planId))?.plan;
        const now = new Date().toISOString();
        const completedBefore = plan?.progress.completedDays ?? 0;
        const alreadyComplete =
          plan?.days.some(
            (day) => day.dayNumber === dayNumber && day.progress.status === "completed",
          ) ?? false;
        const completedAfter = completedBefore + (alreadyComplete ? 0 : 1);
        return {
          completedAt: now,
          planCompletedAt: plan && completedAfter >= plan.lengthDays ? now : null,
        };
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData<StudyDayEnvelope>(
        apiQueryKeys.studyDay(planId, dayNumber),
        (current) =>
          current
            ? {
                day: {
                  ...current.day,
                  progress: {
                    ...current.day.progress,
                    status: "completed",
                    completedAt: data.completedAt,
                  },
                },
              }
            : current,
      );

      let completedDetail: ApiPlanDetail | null = null;
      queryClient.setQueryData<PlanEnvelope>(apiQueryKeys.plan(planId), (current) => {
        if (!current) return current;
        const wasComplete = current.plan.days.some(
          (day) => day.dayNumber === dayNumber && day.progress.status === "completed",
        );
        const completedDays = Math.min(
          current.plan.lengthDays,
          current.plan.progress.completedDays + (wasComplete ? 0 : 1),
        );
        const days = current.plan.days.map((day) =>
          day.dayNumber === dayNumber
            ? {
                ...day,
                progress: {
                  ...day.progress,
                  status: "completed" as const,
                  completedAt: data.completedAt,
                },
              }
            : day,
        );
        const nextDay = days.find((day) => day.progress.status !== "completed") ?? null;
        const completedPlan =
          data.planCompletedAt !== null || completedDays === current.plan.lengthDays;
        const plan: ApiPlanDetail = {
          ...current.plan,
          status: completedPlan ? "completed" : current.plan.status,
          completedAt: data.planCompletedAt ?? current.plan.completedAt,
          progress: {
            completedDays,
            currentDayNumber: nextDay?.dayNumber ?? null,
            percentage: Math.round((completedDays / Math.max(1, current.plan.lengthDays)) * 100),
          },
          currentDay: nextDay
            ? {
                id: nextDay.id,
                dayNumber: nextDay.dayNumber,
                title: nextDay.reading.title,
                estimatedMinutes: nextDay.estimatedMinutes,
                scheduledOn: nextDay.progress.scheduledOn,
                status: nextDay.progress.status,
                quickCheck: nextDay.quickCheck,
              }
            : null,
          days,
        };
        completedDetail = plan;
        return { plan };
      });

      const detail = completedDetail;
      if (detail) {
        queryClient.setQueryData<PlansEnvelope>(apiQueryKeys.plans, (current) =>
          current
            ? {
                plans: current.plans.map((plan) =>
                  plan.id === planId ? toPlanSummary(detail) : plan,
                ),
              }
            : current,
        );
      }
      void persistStudyCaches(queryClient, planId, dayNumber);
      void persistPlansCache(queryClient);
      void invalidateStudySurfaces(queryClient, planId);
    },
  });
}
