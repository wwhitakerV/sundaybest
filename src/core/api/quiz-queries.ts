import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ApiQuizSession,
  getPlanResponseSchema,
  getQuizAttemptResponseSchema,
} from "./contracts";
import { createIdempotencyKey } from "./idempotency";
import { apiQueryKeys } from "./query-keys";
import { useSundayBestApi } from "./ApiProvider";
import { cachedServerQuery, offlineCacheKeys, persistServerCache } from "./offline-cache";
import {
  type PlanEnvelope,
  type PlansEnvelope,
  invalidateStudySurfaces,
  persistPlansCache,
} from "./query-cache-sync";

// Quick Check: a quiz's session, and the writes that start, answer, and finish it.

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

/**
 * Takes a finished Quick Check again: a fresh attempt from its first question
 * becomes the session, so the Quick Check opens on question 1. The finished
 * attempt still counts on Progress until this one is finished.
 */
export function useRetakeQuizMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quizId: string) =>
      api.quizzes.retake(quizId, createIdempotencyKey(`quiz:${quizId}:retake`)),
    onSuccess: (data, quizId) => {
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
