import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import type {
  ApiPlanDetail,
  ApiPlanSummary,
  ApiQuizSession,
  ApiReminder,
  ApiStudyDay,
  ApiUser,
  ApiUserSettings,
  CreatePlanRequest,
  ReminderKind,
  ResolveSermonRequest,
  UpdateReminderRequest,
  UpdateSettingsRequest,
} from "./contracts";
import {
  getMeResponseSchema,
  getSettingsResponseSchema,
  getRemindersResponseSchema,
  listPlansResponseSchema,
  getPlanResponseSchema,
  getStudyDayResponseSchema,
  getQuizAttemptResponseSchema,
  progressResponseSchema,
} from "./contracts";
import { createIdempotencyKey } from "./idempotency";
import { apiMutationKeys, apiQueryKeys, isStudyDayQueryKey } from "./query-keys";
import { planQueryOptions, studyDayQueryOptions } from "./query-options";
import { useSundayBestApi } from "./ApiProvider";
import {
  cachedCurrentUserQuery,
  cachedServerQuery,
  isOfflineTransportFailure,
  offlineCacheKeys,
  persistServerCache,
} from "./offline-cache";
import { enqueueMutation } from "@/core/storage/mutation-outbox";
import { removeCachedResource } from "@/core/storage/api-resource-cache";
import { withoutUndefined } from "@/utils/object/withoutUndefined";

type MeEnvelope = { user: ApiUser };
type SettingsEnvelope = { settings: ApiUserSettings };
type RemindersEnvelope = { reminders: ApiReminder[] };
type PlansEnvelope = { plans: ApiPlanSummary[] };
type PlanEnvelope = { plan: ApiPlanDetail };
type StudyDayEnvelope = { day: ApiStudyDay };

export function useCurrentUserQuery() {
  const api = useSundayBestApi();
  return useQuery({
    queryKey: apiQueryKeys.me,
    queryFn: () =>
      cachedCurrentUserQuery({
        schema: getMeResponseSchema,
        fetcher: () => api.user.getMe(),
      }),
  });
}

export function useUserSettingsQuery() {
  const api = useSundayBestApi();
  return useQuery({
    queryKey: apiQueryKeys.settings,
    queryFn: () =>
      cachedServerQuery({
        cacheKey: offlineCacheKeys.settings,
        resourceType: "settings",
        schema: getSettingsResponseSchema,
        fetcher: () => api.settings.get(),
      }),
  });
}

export function useRemindersQuery() {
  const api = useSundayBestApi();
  return useQuery({
    queryKey: apiQueryKeys.reminders,
    queryFn: () =>
      cachedServerQuery({
        cacheKey: offlineCacheKeys.reminders,
        resourceType: "reminders",
        schema: getRemindersResponseSchema,
        fetcher: () => api.reminders.list(),
      }),
  });
}

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

export function useStudyDayQuery(planId: string, dayNumber: number) {
  const api = useSundayBestApi();
  return useQuery({
    ...studyDayQueryOptions(api, planId, dayNumber),
    enabled: planId.length > 0 && dayNumber > 0,
  });
}

export function useQuizSessionQuery(quizId: string, enabled = true) {
  const api = useSundayBestApi();
  return useQuery({
    queryKey: apiQueryKeys.quizSession(quizId),
    queryFn: () =>
      cachedServerQuery({
        cacheKey: offlineCacheKeys.quizSession(quizId),
        resourceType: "quizSession",
        schema: getQuizAttemptResponseSchema,
        fetcher: () => api.quizzes.getCurrentAttempt(quizId),
      }),
    enabled: enabled && quizId.length > 0,
    retry: false,
  });
}

export function useProgressQuery(weekStart: string, enabled = true) {
  const api = useSundayBestApi();
  return useQuery({
    queryKey: apiQueryKeys.progress(weekStart),
    queryFn: () =>
      cachedServerQuery({
        cacheKey: offlineCacheKeys.progress(weekStart),
        resourceType: "progress",
        schema: progressResponseSchema,
        fetcher: () => api.progress.get(weekStart),
      }),
    enabled,
  });
}

export function useSermonSearchQuery(query: string, enabled = true) {
  const api = useSundayBestApi();
  const normalized = query.trim();
  return useQuery({
    queryKey: apiQueryKeys.sermonSearch(normalized),
    queryFn: () => api.sermons.search(normalized),
    enabled: enabled && normalized.length >= 2,
  });
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

export function useCompleteOnboardingMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.user.completeOnboarding(createIdempotencyKey("user:onboarding")),
    onSuccess: (data) => {
      queryClient.setQueryData<MeEnvelope>(apiQueryKeys.me, data);
      void persistServerCache({
        cacheKey: offlineCacheKeys.me,
        resourceType: "me",
        schema: getMeResponseSchema,
        value: data,
      });
    },
  });
}

export function useUpdateSettingsMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSettingsRequest) => {
      const idempotencyKey = createIdempotencyKey("settings:update");
      try {
        return await api.settings.update(input, idempotencyKey);
      } catch (cause) {
        if (!isOfflineTransportFailure(cause)) throw cause;
        const current = queryClient.getQueryData<SettingsEnvelope>(apiQueryKeys.settings);
        if (!current) throw cause;
        await enqueueMutation({
          kind: "settings.update",
          entityKey: "settings",
          payload: { input },
          idempotencyKey,
        });
        return {
          settings: {
            ...current.settings,
            ...withoutUndefined(input),
            updatedAt: new Date().toISOString(),
          },
        };
      }
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: apiQueryKeys.settings });
      const previous = queryClient.getQueryData<SettingsEnvelope>(apiQueryKeys.settings);
      if (previous) {
        queryClient.setQueryData<SettingsEnvelope>(apiQueryKeys.settings, {
          settings: { ...previous.settings, ...withoutUndefined(input) },
        });
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData<SettingsEnvelope>(apiQueryKeys.settings, context.previous);
      }
    },
    onSuccess: (data, input) => {
      queryClient.setQueryData<SettingsEnvelope>(apiQueryKeys.settings, data);
      // A study day carries its Scripture in the reader's translation.
      if (input.bibleTranslation) {
        void queryClient.invalidateQueries({
          predicate: (query) => isStudyDayQueryKey(query.queryKey),
        });
      }
      void persistServerCache({
        cacheKey: offlineCacheKeys.settings,
        resourceType: "settings",
        schema: getSettingsResponseSchema,
        value: data,
      });
    },
  });
}

export function useUpdateReminderMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ kind, input }: { kind: ReminderKind; input: UpdateReminderRequest }) => {
      const idempotencyKey = createIdempotencyKey(`reminder:${kind}`);
      try {
        return await api.reminders.update(kind, input, idempotencyKey);
      } catch (cause) {
        if (!isOfflineTransportFailure(cause)) throw cause;
        const current = queryClient
          .getQueryData<RemindersEnvelope>(apiQueryKeys.reminders)
          ?.reminders.find((item) => item.kind === kind);
        if (!current) throw cause;
        await enqueueMutation({
          kind: "reminder.update",
          entityKey: kind,
          payload: { kind, input },
          idempotencyKey,
        });
        return {
          reminder: {
            ...current,
            ...withoutUndefined(input),
            updatedAt: new Date().toISOString(),
          },
        };
      }
    },
    onMutate: async ({ kind, input }) => {
      await queryClient.cancelQueries({ queryKey: apiQueryKeys.reminders });
      const previous = queryClient.getQueryData<RemindersEnvelope>(apiQueryKeys.reminders);
      if (previous) {
        queryClient.setQueryData<RemindersEnvelope>(apiQueryKeys.reminders, {
          reminders: previous.reminders.map((item) =>
            item.kind === kind ? { ...item, ...withoutUndefined(input) } : item,
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData<RemindersEnvelope>(apiQueryKeys.reminders, context.previous);
      }
    },
    onSuccess: ({ reminder }) => {
      queryClient.setQueryData<RemindersEnvelope>(apiQueryKeys.reminders, (current) => {
        if (!current) return { reminders: [reminder] };
        const exists = current.reminders.some((item) => item.id === reminder.id);
        return {
          reminders: exists
            ? current.reminders.map((item) => (item.id === reminder.id ? reminder : item))
            : [...current.reminders, reminder],
        };
      });
      void persistServerCache({
        cacheKey: offlineCacheKeys.reminders,
        resourceType: "reminders",
        schema: getRemindersResponseSchema,
        value: queryClient.getQueryData<RemindersEnvelope>(apiQueryKeys.reminders),
      });
    },
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

export function useArchivePlanMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      const idempotencyKey = createIdempotencyKey(`plan:${planId}:archive`);
      try {
        return await api.plans.archive(planId, idempotencyKey);
      } catch (cause) {
        if (!isOfflineTransportFailure(cause)) throw cause;
        const current = queryClient
          .getQueryData<PlansEnvelope>(apiQueryKeys.plans)
          ?.plans.find((item) => item.id === planId);
        if (!current) throw cause;
        await enqueueMutation({
          kind: "plan.archive",
          entityKey: planId,
          payload: { planId },
          idempotencyKey,
        });
        const now = new Date().toISOString();
        return {
          plan: { ...current, status: "archived" as const, archivedAt: now, updatedAt: now },
        };
      }
    },
    onSuccess: ({ plan }) => {
      queryClient.setQueryData<PlansEnvelope>(apiQueryKeys.plans, (current) =>
        current
          ? { plans: current.plans.map((item) => (item.id === plan.id ? plan : item)) }
          : current,
      );
      queryClient.setQueryData<PlanEnvelope>(apiQueryKeys.plan(plan.id), (current) =>
        current ? { plan: { ...current.plan, ...plan, days: current.plan.days } } : current,
      );
      void persistPlansCache(queryClient);
      void persistServerCache({
        cacheKey: offlineCacheKeys.plan(plan.id),
        resourceType: "plan",
        schema: getPlanResponseSchema,
        value: queryClient.getQueryData<PlanEnvelope>(apiQueryKeys.plan(plan.id)),
      });
      void queryClient.invalidateQueries({ queryKey: apiQueryKeys.plan(plan.id) });
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

export function useStartQuizAttemptMutation(quizId: string) {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.quizzes.startAttempt(quizId, createIdempotencyKey(`quiz:${quizId}:start`)),
    onSuccess: (data) => {
      queryClient.setQueryData<ApiQuizSession>(apiQueryKeys.quizSession(quizId), data);
      void persistServerCache({
        cacheKey: offlineCacheKeys.quizSession(quizId),
        resourceType: "quizSession",
        schema: getQuizAttemptResponseSchema,
        value: data,
      });
      void queryClient.invalidateQueries({ queryKey: apiQueryKeys.planRoot });
    },
  });
}

export function useSubmitQuizAnswerMutation(quizId: string, attemptId: string) {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { questionId: string; choiceId: string }) =>
      api.quizzes.submitAnswer(
        attemptId,
        input,
        createIdempotencyKey(`quiz:${attemptId}:answer:${input.questionId}`),
      ),
    onSuccess: (answer) => {
      queryClient.setQueryData<ApiQuizSession>(apiQueryKeys.quizSession(quizId), (current) => {
        if (!current) return current;
        const withoutPrevious = current.answers.filter(
          (candidate) => candidate.questionId !== answer.questionId,
        );
        return { ...current, answers: [...withoutPrevious, answer] };
      });
      void persistServerCache({
        cacheKey: offlineCacheKeys.quizSession(quizId),
        resourceType: "quizSession",
        schema: getQuizAttemptResponseSchema,
        value: queryClient.getQueryData<ApiQuizSession>(apiQueryKeys.quizSession(quizId)),
      });
      void queryClient.invalidateQueries({ queryKey: apiQueryKeys.planRoot });
    },
  });
}

export function useCompleteQuizAttemptMutation(quizId: string, attemptId: string, planId: string) {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.quizzes.completeAttempt(attemptId, createIdempotencyKey(`quiz:${attemptId}:complete`)),
    onSuccess: ({ attempt, score }) => {
      queryClient.setQueryData<ApiQuizSession>(apiQueryKeys.quizSession(quizId), (current) =>
        current ? { ...current, attempt, score } : current,
      );

      const completedStanding = {
        id: quizId,
        status: "completed" as const,
        questionCount: score.total,
        answeredCount: score.total,
        correctCount: score.correct,
      };

      // Keep the detail/list caches coherent before the background refetch
      // lands. This matters on the final day: the user can move from the score
      // straight through Day Complete to Plan Complete, whose summary should
      // already contain the score rather than briefly showing the old standing.
      queryClient.setQueryData<PlanEnvelope>(apiQueryKeys.plan(planId), (current) => {
        if (!current) return current;
        return {
          plan: {
            ...current.plan,
            days: current.plan.days.map((day) =>
              day.quickCheck?.id === quizId ? { ...day, quickCheck: completedStanding } : day,
            ),
            currentDay:
              current.plan.currentDay?.quickCheck?.id === quizId
                ? { ...current.plan.currentDay, quickCheck: completedStanding }
                : current.plan.currentDay,
          },
        };
      });
      queryClient.setQueryData<PlansEnvelope>(apiQueryKeys.plans, (current) =>
        current
          ? {
              plans: current.plans.map((plan) =>
                plan.id === planId && plan.currentDay?.quickCheck?.id === quizId
                  ? {
                      ...plan,
                      currentDay: { ...plan.currentDay, quickCheck: completedStanding },
                    }
                  : plan,
              ),
            }
          : current,
      );

      void persistServerCache({
        cacheKey: offlineCacheKeys.quizSession(quizId),
        resourceType: "quizSession",
        schema: getQuizAttemptResponseSchema,
        value: queryClient.getQueryData<ApiQuizSession>(apiQueryKeys.quizSession(quizId)),
      });
      void persistServerCache({
        cacheKey: offlineCacheKeys.plan(planId),
        resourceType: "plan",
        schema: getPlanResponseSchema,
        value: queryClient.getQueryData<PlanEnvelope>(apiQueryKeys.plan(planId)),
      });
      void persistPlansCache(queryClient);
      void invalidateStudySurfaces(queryClient, planId);
    },
  });
}

function toPlanSummary(plan: ApiPlanDetail): ApiPlanSummary {
  const { days: _days, ...summary } = plan;
  return summary;
}

async function invalidateStudySurfaces(queryClient: QueryClient, planId?: string): Promise<void> {
  const work = [
    queryClient.invalidateQueries({ queryKey: apiQueryKeys.plans }),
    queryClient.invalidateQueries({ queryKey: apiQueryKeys.progressRoot }),
  ];
  if (planId) {
    work.push(queryClient.invalidateQueries({ queryKey: apiQueryKeys.plan(planId) }));
  }
  await Promise.all(work);
}

async function persistPlansCache(queryClient: QueryClient): Promise<void> {
  await persistServerCache({
    cacheKey: offlineCacheKeys.plans,
    resourceType: "plans",
    schema: listPlansResponseSchema,
    value: queryClient.getQueryData<PlansEnvelope>(apiQueryKeys.plans),
  });
}

async function persistStudyCaches(
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
