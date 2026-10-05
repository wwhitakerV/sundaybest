import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import type {
  ApiPlanDetail,
  ApiPlanGeneration,
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
import { createIdempotencyKey } from "./idempotency";
import { apiQueryKeys } from "./query-keys";
import { useSundayBestApi } from "./ApiProvider";

type MeEnvelope = { user: ApiUser };
type SettingsEnvelope = { settings: ApiUserSettings };
type RemindersEnvelope = { reminders: ApiReminder[] };
type PlansEnvelope = { plans: ApiPlanSummary[] };
type PlanEnvelope = { plan: ApiPlanDetail };
type StudyDayEnvelope = { day: ApiStudyDay };

export function useCurrentUserQuery() {
  const api = useSundayBestApi();
  return useQuery({ queryKey: apiQueryKeys.me, queryFn: () => api.user.getMe() });
}

export function useUserSettingsQuery() {
  const api = useSundayBestApi();
  return useQuery({ queryKey: apiQueryKeys.settings, queryFn: () => api.settings.get() });
}

export function useRemindersQuery() {
  const api = useSundayBestApi();
  return useQuery({ queryKey: apiQueryKeys.reminders, queryFn: () => api.reminders.list() });
}

export function usePlansQuery(enabled = true) {
  const api = useSundayBestApi();
  return useQuery({
    queryKey: apiQueryKeys.plans,
    queryFn: () => api.plans.list(),
    enabled,
  });
}

export function usePlanQuery(planId: string) {
  const api = useSundayBestApi();
  return useQuery({
    queryKey: apiQueryKeys.plan(planId),
    queryFn: () => api.plans.get(planId),
    enabled: planId.length > 0,
  });
}

export function useStudyDayQuery(planId: string, dayNumber: number) {
  const api = useSundayBestApi();
  return useQuery({
    queryKey: apiQueryKeys.studyDay(planId, dayNumber),
    queryFn: () => api.study.getDay(planId, dayNumber),
    enabled: planId.length > 0 && dayNumber > 0,
  });
}

export function useQuizSessionQuery(quizId: string, enabled = true) {
  const api = useSundayBestApi();
  return useQuery({
    queryKey: apiQueryKeys.quizSession(quizId),
    queryFn: () => api.quizzes.getCurrentAttempt(quizId),
    enabled: enabled && quizId.length > 0,
    retry: false,
  });
}

export function useProgressQuery(weekStart: string, enabled = true) {
  const api = useSundayBestApi();
  return useQuery({
    queryKey: apiQueryKeys.progress(weekStart),
    queryFn: () => api.progress.get(weekStart),
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


export function usePlanGenerationQuery(generationId: string, enabled = true) {
  const api = useSundayBestApi();
  return useQuery({
    queryKey: apiQueryKeys.generation(generationId),
    queryFn: () => api.generations.get(generationId),
    enabled: enabled && generationId.length > 0,
    refetchInterval: (query) => {
      const status = query.state.data?.generation.status;
      return status === "completed" || status === "failed" ? false : 900;
    },
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
    mutationFn: (input: CreatePlanRequest) =>
      api.plans.create(
        input,
        createIdempotencyKey(
          `plan:create:${input.sermonId}:${input.lengthDays}:${input.quickCheckEnabled ? "quiz" : "no-quiz"}`,
        ),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: apiQueryKeys.plans });
    },
  });
}

export function useRetryPlanGenerationMutation(generationId: string) {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.generations.retry(
        generationId,
        createIdempotencyKey(`generation:${generationId}:retry`),
      ),
    onSuccess: (data) => {
      queryClient.setQueryData<{ generation: ApiPlanGeneration }>(
        apiQueryKeys.generation(generationId),
        data,
      );
    },
  });
}

export function useCompleteOnboardingMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.user.completeOnboarding(createIdempotencyKey("user:onboarding")),
    onSuccess: (data) => queryClient.setQueryData<MeEnvelope>(apiQueryKeys.me, data),
  });
}

export function useUpdateSettingsMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSettingsRequest) =>
      api.settings.update(input, createIdempotencyKey("settings:update")),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: apiQueryKeys.settings });
      const previous = queryClient.getQueryData<SettingsEnvelope>(apiQueryKeys.settings);
      if (previous) {
        queryClient.setQueryData<SettingsEnvelope>(apiQueryKeys.settings, {
          settings: { ...previous.settings, ...input },
        });
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData<SettingsEnvelope>(apiQueryKeys.settings, context.previous);
      }
    },
    onSuccess: (data) => queryClient.setQueryData<SettingsEnvelope>(apiQueryKeys.settings, data),
  });
}

export function useUpdateReminderMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ kind, input }: { kind: ReminderKind; input: UpdateReminderRequest }) =>
      api.reminders.update(kind, input, createIdempotencyKey(`reminder:${kind}`)),
    onMutate: async ({ kind, input }) => {
      await queryClient.cancelQueries({ queryKey: apiQueryKeys.reminders });
      const previous = queryClient.getQueryData<RemindersEnvelope>(apiQueryKeys.reminders);
      if (previous) {
        queryClient.setQueryData<RemindersEnvelope>(apiQueryKeys.reminders, {
          reminders: previous.reminders.map((item) =>
            item.kind === kind ? { ...item, ...input } : item,
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
      void queryClient.invalidateQueries({ queryKey: apiQueryKeys.progressRoot });
    },
  });
}

export function useArchivePlanMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) =>
      api.plans.archive(planId, createIdempotencyKey(`plan:${planId}:archive`)),
    onSuccess: ({ plan }) => {
      queryClient.setQueryData<PlansEnvelope>(apiQueryKeys.plans, (current) =>
        current
          ? { plans: current.plans.map((item) => (item.id === plan.id ? plan : item)) }
          : current,
      );
      void queryClient.invalidateQueries({ queryKey: apiQueryKeys.plan(plan.id) });
      void queryClient.invalidateQueries({ queryKey: apiQueryKeys.progressRoot });
    },
  });
}

export function useSetPlanSavedMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, saved }: { planId: string; saved: boolean }) =>
      saved
        ? api.plans.save(planId, createIdempotencyKey(`plan:${planId}:save`))
        : api.plans.removeSaved(planId, createIdempotencyKey(`plan:${planId}:unsave`)),
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
      if (context.previousPlans) queryClient.setQueryData(apiQueryKeys.plans, context.previousPlans);
      if (context.previousPlan) queryClient.setQueryData(apiQueryKeys.plan(context.planId), context.previousPlan);
    },
  });
}


export function useCompleteStudyStepMutation(planId: string, dayNumber: number) {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (step: "read" | "scripture" | "reflect" | "pray") =>
      api.study.completeStep(
        planId,
        dayNumber,
        step,
        createIdempotencyKey(`study:${planId}:${dayNumber}:${step}`),
      ),
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
      void invalidateStudySurfaces(queryClient, planId);
    },
  });
}

export function useCompleteStudyDayMutation(planId: string, dayNumber: number) {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.study.completeDay(
        planId,
        dayNumber,
        createIdempotencyKey(`study:${planId}:${dayNumber}:complete`),
      ),
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
        const completedPlan = data.planCompletedAt !== null || completedDays === current.plan.lengthDays;
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
      void invalidateStudySurfaces(queryClient, planId);
    },
  });
}

export function useStartQuizAttemptMutation(quizId: string) {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.quizzes.startAttempt(
        quizId,
        createIdempotencyKey(`quiz:${quizId}:start`),
      ),
    onSuccess: (data) => {
      queryClient.setQueryData<ApiQuizSession>(apiQueryKeys.quizSession(quizId), data);
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
      void queryClient.invalidateQueries({ queryKey: apiQueryKeys.planRoot });
    },
  });
}

export function useCompleteQuizAttemptMutation(quizId: string, attemptId: string, planId: string) {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.quizzes.completeAttempt(
        attemptId,
        createIdempotencyKey(`quiz:${attemptId}:complete`),
      ),
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

      void invalidateStudySurfaces(queryClient, planId);
    },
  });
}

function toPlanSummary(plan: ApiPlanDetail): ApiPlanSummary {
  const { days: _days, ...summary } = plan;
  return summary;
}

async function invalidateStudySurfaces(
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
