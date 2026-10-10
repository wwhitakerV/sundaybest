import type { ApiClient } from "./client";
import { createPlansApi } from "./plans-api";
import {
  completeOnboardingResponseSchema,
  completeQuizAttemptResponseSchema,
  completeStudyDayResponseSchema,
  completeStudyStepRequestSchema,
  completeStudyStepResponseSchema,
  getMeResponseSchema,
  getPlanGenerationResponseSchema,
  listCurrentPlanGenerationsResponseSchema,
  dismissPlanGenerationResponseSchema,
  getQuizAttemptResponseSchema,
  getRemindersResponseSchema,
  getSettingsResponseSchema,
  getStudyDayResponseSchema,
  mutationAckSchema,
  resolveSermonRequestSchema,
  resolveSermonResponseSchema,
  searchSermonsResponseSchema,
  progressResponseSchema,
  weekResponseSchema,
  weeksResponseSchema,
  wordResponseSchema,
  reflectionsResponseSchema,
  quickChecksResponseSchema,
  retryPlanGenerationResponseSchema,
  startQuizAttemptResponseSchema,
  submitQuizAnswerRequestSchema,
  submitQuizAnswerResponseSchema,
  updateMeRequestSchema,
  updateReminderRequestSchema,
  updateSettingsRequestSchema,
  updateReminderResponseSchema,
  type ReminderKind,
  type UpdateMeRequest,
  type UpdateReminderRequest,
  type UpdateSettingsRequest,
  type ResolveSermonRequest,
} from "./contracts";

/**
 * Typed façade over the REST API. Features call this, never hand-build URLs or
 * cast JSON. Request bodies are validated before leaving the device and every
 * response is parsed again at the trust boundary by ApiClient.
 */
export function createSundayBestApi(client: ApiClient) {
  return {
    user: {
      getMe: () => client.request({ path: "/v1/me", schema: getMeResponseSchema }),
      updateMe: (input: UpdateMeRequest, idempotencyKey: string) =>
        client.request({
          path: "/v1/me",
          method: "PATCH",
          body: updateMeRequestSchema.parse(input),
          schema: getMeResponseSchema,
          idempotencyKey,
          idempotent: true,
        }),
      completeOnboarding: (idempotencyKey: string) =>
        client.request({
          path: "/v1/me/onboarding/complete",
          method: "POST",
          schema: completeOnboardingResponseSchema,
          idempotencyKey,
          idempotent: true,
        }),
      deleteMe: (idempotencyKey: string) =>
        client.request({
          path: "/v1/me",
          method: "DELETE",
          schema: mutationAckSchema,
          sensitive: true,
          idempotencyKey,
          idempotent: true,
        }),
    },

    settings: {
      get: () => client.request({ path: "/v1/me/settings", schema: getSettingsResponseSchema }),
      update: (input: UpdateSettingsRequest, idempotencyKey: string) =>
        client.request({
          path: "/v1/me/settings",
          method: "PATCH",
          body: updateSettingsRequestSchema.parse(input),
          schema: getSettingsResponseSchema,
          idempotencyKey,
          idempotent: true,
        }),
    },

    reminders: {
      list: () => client.request({ path: "/v1/me/reminders", schema: getRemindersResponseSchema }),
      update: (kind: ReminderKind, input: UpdateReminderRequest, idempotencyKey: string) =>
        client.request({
          path: `/v1/me/reminders/${encodeURIComponent(kind)}`,
          method: "PUT",
          body: updateReminderRequestSchema.parse(input),
          schema: updateReminderResponseSchema,
          idempotencyKey,
          idempotent: true,
        }),
    },

    sermons: {
      search: (query: string, limit = 10) =>
        client.request({
          path: `/v1/sermons/search?q=${encodeURIComponent(query)}&limit=${limit}`,
          schema: searchSermonsResponseSchema,
        }),
      resolve: (input: ResolveSermonRequest, idempotencyKey: string) =>
        client.request({
          path: "/v1/sermons/resolve",
          method: "POST",
          body: resolveSermonRequestSchema.parse(input),
          schema: resolveSermonResponseSchema,
          idempotencyKey,
          idempotent: true,
        }),
    },

    progress: {
      get: (weekStart?: string) =>
        client.request({
          path: weekStart
            ? `/v1/me/progress?weekStart=${encodeURIComponent(weekStart)}`
            : "/v1/me/progress",
          schema: progressResponseSchema,
        }),
    },

    week: {
      get: (weekStart: string) =>
        client.request({
          path: `/v1/me/week?weekStart=${encodeURIComponent(weekStart)}`,
          schema: weekResponseSchema,
        }),
    },

    weeks: {
      get: () => client.request({ path: "/v1/me/weeks", schema: weeksResponseSchema }),
    },

    word: {
      get: () => client.request({ path: "/v1/me/word", schema: wordResponseSchema }),
    },

    quickChecks: {
      get: () => client.request({ path: "/v1/me/quick-checks", schema: quickChecksResponseSchema }),
    },

    reflections: {
      get: () => client.request({ path: "/v1/me/reflections", schema: reflectionsResponseSchema }),
    },

    plans: createPlansApi(client),

    generations: {
      current: () =>
        client.request({
          path: "/v1/plan-generations/current",
          schema: listCurrentPlanGenerationsResponseSchema,
        }),
      dismiss: (generationId: string, idempotencyKey: string) =>
        client.request({
          path: `/v1/plan-generations/${encodeURIComponent(generationId)}/dismiss`,
          method: "POST",
          schema: dismissPlanGenerationResponseSchema,
          idempotencyKey,
          idempotent: true,
        }),
      get: (generationId: string) =>
        client.request({
          path: `/v1/plan-generations/${encodeURIComponent(generationId)}`,
          schema: getPlanGenerationResponseSchema,
        }),
      retry: (generationId: string, idempotencyKey: string) =>
        client.request({
          path: `/v1/plan-generations/${encodeURIComponent(generationId)}/retry`,
          method: "POST",
          schema: retryPlanGenerationResponseSchema,
          idempotencyKey,
          idempotent: true,
        }),
    },

    study: {
      getDay: (planId: string, dayNumber: number) =>
        client.request({
          path: `/v1/plans/${encodeURIComponent(planId)}/days/${dayNumber}`,
          schema: getStudyDayResponseSchema,
        }),
      completeStep: (
        planId: string,
        dayNumber: number,
        step: "read" | "scripture" | "reflect" | "pray",
        idempotencyKey: string,
      ) =>
        client.request({
          path: `/v1/plans/${encodeURIComponent(planId)}/days/${dayNumber}/steps/${step}`,
          method: "PUT",
          body: completeStudyStepRequestSchema.parse({ step }),
          schema: completeStudyStepResponseSchema,
          idempotencyKey,
          idempotent: true,
        }),
      completeDay: (planId: string, dayNumber: number, idempotencyKey: string) =>
        client.request({
          path: `/v1/plans/${encodeURIComponent(planId)}/days/${dayNumber}/complete`,
          method: "POST",
          schema: completeStudyDayResponseSchema,
          idempotencyKey,
          idempotent: true,
        }),
    },

    quizzes: {
      getCurrentAttempt: (quizId: string) =>
        client.request({
          path: `/v1/quizzes/${encodeURIComponent(quizId)}/attempt`,
          schema: getQuizAttemptResponseSchema,
        }),
      startAttempt: (quizId: string, idempotencyKey: string) =>
        client.request({
          path: `/v1/quizzes/${encodeURIComponent(quizId)}/attempts`,
          method: "POST",
          schema: startQuizAttemptResponseSchema,
          idempotencyKey,
          idempotent: true,
        }),
      /** A finished Quick Check taken again: a fresh attempt from its first question. */
      retake: (quizId: string, idempotencyKey: string) =>
        client.request({
          path: `/v1/quizzes/${encodeURIComponent(quizId)}/retakes`,
          method: "POST",
          schema: startQuizAttemptResponseSchema,
          idempotencyKey,
          idempotent: true,
        }),
      getAttempt: (attemptId: string) =>
        client.request({
          path: `/v1/quiz-attempts/${encodeURIComponent(attemptId)}`,
          schema: getQuizAttemptResponseSchema,
        }),
      submitAnswer: (
        attemptId: string,
        input: { questionId: string; choiceId: string },
        idempotencyKey: string,
      ) =>
        client.request({
          path: `/v1/quiz-attempts/${encodeURIComponent(attemptId)}/answers`,
          method: "POST",
          body: submitQuizAnswerRequestSchema.parse(input),
          schema: submitQuizAnswerResponseSchema,
          idempotencyKey,
          idempotent: true,
        }),
      completeAttempt: (attemptId: string, idempotencyKey: string) =>
        client.request({
          path: `/v1/quiz-attempts/${encodeURIComponent(attemptId)}/complete`,
          method: "POST",
          schema: completeQuizAttemptResponseSchema,
          idempotencyKey,
          idempotent: true,
        }),
    },
  } as const;
}
