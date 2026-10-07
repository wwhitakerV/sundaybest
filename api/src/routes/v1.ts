import { and, eq, isNull } from "drizzle-orm";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

import type { AppContext } from "../app-context.js";
import { requireSensitiveAssertion } from "../auth/assertion-service.js";
import { requireAuth, readSingleHeader } from "../auth/request-auth.js";
import {
  bootstrapSessionRequestSchema,
  challengeRequestSchema,
  challengeResponseSchema,
  completeOnboardingResponseSchema,
  completeQuizAttemptResponseSchema,
  completeStudyDayResponseSchema,
  completeStudyStepRequestSchema,
  completeStudyStepResponseSchema,
  createPlanRequestSchema,
  createPlanResponseSchema,
  getMeResponseSchema,
  getPlanGenerationResponseSchema,
  listCurrentPlanGenerationsResponseSchema,
  dismissPlanGenerationResponseSchema,
  getPlanResponseSchema,
  getQuizAttemptResponseSchema,
  getRemindersResponseSchema,
  getSettingsResponseSchema,
  getStudyDayResponseSchema,
  listPlansResponseSchema,
  mutationAckSchema,
  refreshRequestSchema,
  reminderKindSchema,
  resolveSermonRequestSchema,
  resolveSermonResponseSchema,
  searchSermonsQuerySchema,
  searchSermonsResponseSchema,
  progressResponseSchema,
  isoDateSchema,
  retryPlanGenerationResponseSchema,
  sessionCredentialsSchema,
  startPlanResponseSchema,
  startQuizAttemptResponseSchema,
  submitQuizAnswerRequestSchema,
  submitQuizAnswerResponseSchema,
  updateMeRequestSchema,
  updateReminderRequestSchema,
  updateReminderResponseSchema,
  updateSettingsRequestSchema,
  verifyAttestationRequestSchema,
  archivePlanResponseSchema,
  resetPlanResponseSchema,
  savePlanResponseSchema,
  removeSavedPlanResponseSchema,
} from "../contracts/index.js";
import { deviceInstallations } from "../db/schema.js";
import { isValidTimeZone } from "../domain/time.js";
import { AppError } from "../http/errors.js";
import {
  attemptParamSchema,
  dayParamSchema,
  dayStepParamSchema,
  generationParamSchema,
  parseWithSchema,
  planParamSchema,
  quizParamSchema,
} from "../http/validation.js";
import { createGenerationService } from "../services/generation-service.js";
import { requireIdempotencyKey, runIdempotent } from "../services/idempotency.js";
import { createPlanService } from "../services/plan-service.js";
import { createProgressService } from "../services/progress-service.js";
import { createQuizService } from "../services/quiz-service.js";
import { createSermonService } from "../services/sermon-service.js";
import { availableTranslations } from "../providers/bible-provider.js";
import { createSettingsService } from "../services/settings-service.js";
import { createStudyService } from "../services/study-service.js";
import { createUserService } from "../services/user-service.js";

const emptyObjectSchema = z.object({}).strict();
const devSessionSchema = z
  .object({
    installationId: z.string().trim().min(1).max(128).optional(),
    timezone: z.string().optional(),
  })
  .strict();

export async function registerV1Routes(app: FastifyInstance, context: AppContext): Promise<void> {
  const { db } = context.database;
  const userService = createUserService(db);
  const settingsService = createSettingsService(db, availableTranslations(context.env));
  const sermonService = createSermonService(db, context.env);
  const generationService = createGenerationService(db);
  const planService = createPlanService(db);
  const progressService = createProgressService(db);
  const studyService = createStudyService(db, context.bible);
  const quizService = createQuizService(db);

  app.post("/v1/attest/challenge", async (request) => {
    const body = parseWithSchema(challengeRequestSchema, request.body ?? {});
    return challengeResponseSchema.parse(await context.challenges.issue(body.keyId));
  });

  app.post("/v1/attest/verify", async (request) => {
    const body = parseWithSchema(verifyAttestationRequestSchema, request.body);
    await context.challenges.consume({ challenge: body.challenge });
    const verified = context.verifier.verifyAttestation(body);
    const timezone = readTimezone(request);
    const credentials = await context.sessions.createAnonymousInstall({
      keyId: body.keyId,
      publicKeyPem: verified.publicKeyPem,
      ...(timezone ? { timezone } : {}),
    });
    return sessionCredentialsSchema.parse(credentials);
  });

  app.post("/v1/session/bootstrap", async (request) => {
    const body = parseWithSchema(bootstrapSessionRequestSchema, request.body);
    await context.challenges.consume({ challenge: body.challenge, keyId: body.keyId });
    const installation = await requireInstallationByKey(context, body.keyId);
    const verified = context.verifier.verifyAssertion({
      payload: body.challenge,
      assertion: body.assertion,
      publicKeyPem: installation.publicKeyPem,
      previousSignCount: installation.signCount,
    });
    await advanceCounter(
      context,
      installation.id,
      installation.signCount,
      verified.signCount,
      readTimezone(request),
    );
    return sessionCredentialsSchema.parse(
      await context.sessions.issueForInstallation({
        userId: installation.userId,
        installationId: installation.id,
      }),
    );
  });

  app.post("/v1/session/refresh", async (request) => {
    const body = parseWithSchema(refreshRequestSchema, request.body);
    await context.challenges.consume({ challenge: body.challenge, keyId: body.keyId });
    const installation = await requireInstallationByKey(context, body.keyId);
    const verified = context.verifier.verifyAssertion({
      payload: body.challenge,
      assertion: body.assertion,
      publicKeyPem: installation.publicKeyPem,
      previousSignCount: installation.signCount,
    });
    await advanceCounter(
      context,
      installation.id,
      installation.signCount,
      verified.signCount,
      readTimezone(request),
    );
    return sessionCredentialsSchema.parse(
      await context.sessions.rotate({ keyId: body.keyId, refreshToken: body.refreshToken }),
    );
  });

  if (context.env.NODE_ENV !== "production" && context.env.DEV_SESSION_ENABLED) {
    app.post("/v1/dev/session", async (request) => {
      const body = parseWithSchema(devSessionSchema, request.body ?? {});
      if (body.timezone && !isValidTimeZone(body.timezone))
        throw new AppError("VALIDATION_FAILED", "Invalid timezone");
      return sessionCredentialsSchema.parse(
        await context.sessions.createDevelopmentInstall({
          ...(body.installationId !== undefined ? { installationId: body.installationId } : {}),
          ...(body.timezone !== undefined ? { timezone: body.timezone } : {}),
        }),
      );
    });
  }

  app.post("/v1/session/revoke", async (request) => {
    parseWithSchema(emptyObjectSchema, request.body ?? {});
    const auth = await requireAuth(request, db, context.jwt);
    await context.sessions.revokeInstallation(auth.installationId);
    return mutationAckSchema.parse({ ok: true });
  });

  app.get("/v1/me", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    return getMeResponseSchema.parse({ user: await userService.get(auth.userId) });
  });

  app.patch("/v1/me", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    const body = parseWithSchema(updateMeRequestSchema, request.body);
    return idempotent(request, context, auth.userId, "PATCH /v1/me", body, async () =>
      getMeResponseSchema.parse({ user: await userService.update(auth.userId, body) }),
    );
  });

  app.post("/v1/me/onboarding/complete", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    return idempotent(
      request,
      context,
      auth.userId,
      "POST /v1/me/onboarding/complete",
      {},
      async () =>
        completeOnboardingResponseSchema.parse({
          user: await userService.completeOnboarding(auth.userId),
        }),
    );
  });

  app.delete("/v1/me", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    await requireSensitiveAssertion({
      request,
      auth,
      db,
      challenges: context.challenges,
      verifier: context.verifier,
      allowDevelopmentInstall:
        context.env.NODE_ENV !== "production" && context.env.DEV_SESSION_ENABLED,
    });
    return idempotent(request, context, auth.userId, "DELETE /v1/me", {}, async () => {
      await userService.delete(auth.userId);
      return mutationAckSchema.parse({ ok: true });
    });
  });

  app.get("/v1/me/settings", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    return getSettingsResponseSchema.parse({
      settings: await settingsService.getSettings(auth.userId),
    });
  });

  app.patch("/v1/me/settings", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    const body = parseWithSchema(updateSettingsRequestSchema, request.body);
    return idempotent(request, context, auth.userId, "PATCH /v1/me/settings", body, async () =>
      getSettingsResponseSchema.parse({
        settings: await settingsService.updateSettings(auth.userId, body),
      }),
    );
  });

  app.get("/v1/me/reminders", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    return getRemindersResponseSchema.parse({
      reminders: await settingsService.listReminders(auth.userId),
    });
  });

  app.put("/v1/me/reminders/:kind", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    const kind = parseWithSchema(z.object({ kind: reminderKindSchema }), request.params).kind;
    const body = parseWithSchema(updateReminderRequestSchema, request.body);
    return idempotent(
      request,
      context,
      auth.userId,
      `PUT /v1/me/reminders/${kind}`,
      body,
      async () =>
        updateReminderResponseSchema.parse({
          reminder: await settingsService.updateReminder(auth.userId, kind, body),
        }),
    );
  });

  app.get("/v1/sermons/search", async (request) => {
    await requireAuth(request, db, context.jwt);
    const query = parseWithSchema(searchSermonsQuerySchema, request.query);
    return searchSermonsResponseSchema.parse({
      sermons: await sermonService.search(query.q, query.limit),
    });
  });

  app.post("/v1/sermons/resolve", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    const body = parseWithSchema(resolveSermonRequestSchema, request.body);
    return idempotent(request, context, auth.userId, "POST /v1/sermons/resolve", body, async () =>
      resolveSermonResponseSchema.parse({ sermon: await sermonService.resolve(body.url) }),
    );
  });

  app.get("/v1/me/progress", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    const query = parseWithSchema(
      z.object({ weekStart: isoDateSchema.optional() }).strict(),
      request.query ?? {},
    );
    return progressResponseSchema.parse(
      await progressService.get(auth.userId, auth.timezone, query.weekStart),
    );
  });

  app.get("/v1/plans", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    return listPlansResponseSchema.parse({
      plans: await planService.list(auth.userId, auth.timezone),
    });
  });

  app.get("/v1/plans/:planId", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    const { planId } = parseWithSchema(planParamSchema, request.params);
    return getPlanResponseSchema.parse({
      plan: await planService.getDetail(auth.userId, planId, auth.timezone),
    });
  });

  app.post("/v1/plans", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    await requireSensitiveAssertion({
      request,
      auth,
      db,
      challenges: context.challenges,
      verifier: context.verifier,
      allowDevelopmentInstall:
        context.env.NODE_ENV !== "production" && context.env.DEV_SESSION_ENABLED,
    });
    const body = parseWithSchema(createPlanRequestSchema, request.body);
    return idempotent(request, context, auth.userId, "POST /v1/plans", body, async (requestKey) =>
      createPlanResponseSchema.parse(await generationService.create(auth.userId, body, requestKey)),
    );
  });

  app.post("/v1/plans/:planId/start", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    const { planId } = parseWithSchema(planParamSchema, request.params);
    return idempotent(
      request,
      context,
      auth.userId,
      `POST /v1/plans/${planId}/start`,
      {},
      async () =>
        startPlanResponseSchema.parse({
          plan: await planService.start(auth.userId, planId, auth.timezone),
        }),
    );
  });

  app.post("/v1/plans/:planId/archive", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    const { planId } = parseWithSchema(planParamSchema, request.params);
    return idempotent(
      request,
      context,
      auth.userId,
      `POST /v1/plans/${planId}/archive`,
      {},
      async () =>
        archivePlanResponseSchema.parse({
          plan: await planService.archive(auth.userId, planId, auth.timezone),
        }),
    );
  });

  app.post("/v1/plans/:planId/reset", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    const { planId } = parseWithSchema(planParamSchema, request.params);
    return idempotent(
      request,
      context,
      auth.userId,
      `POST /v1/plans/${planId}/reset`,
      {},
      async () =>
        resetPlanResponseSchema.parse(await planService.reset(auth.userId, planId, auth.timezone)),
    );
  });

  app.put("/v1/plans/:planId/saved", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    const { planId } = parseWithSchema(planParamSchema, request.params);
    return idempotent(
      request,
      context,
      auth.userId,
      `PUT /v1/plans/${planId}/saved`,
      {},
      async () => {
        await planService.save(auth.userId, planId);
        return savePlanResponseSchema.parse({ saved: true });
      },
    );
  });

  app.delete("/v1/plans/:planId/saved", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    const { planId } = parseWithSchema(planParamSchema, request.params);
    return idempotent(
      request,
      context,
      auth.userId,
      `DELETE /v1/plans/${planId}/saved`,
      {},
      async () => {
        await planService.unsave(auth.userId, planId);
        return removeSavedPlanResponseSchema.parse({ saved: false });
      },
    );
  });

  app.get("/v1/plan-generations/current", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    return listCurrentPlanGenerationsResponseSchema.parse({
      generations: await generationService.listCurrent(auth.userId),
    });
  });

  app.post("/v1/plan-generations/:generationId/dismiss", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    const { generationId } = parseWithSchema(generationParamSchema, request.params);
    return idempotent(request, context, auth.userId, `POST /v1/plan-generations/${generationId}/dismiss`, {}, async () =>
      dismissPlanGenerationResponseSchema.parse({ generation: await generationService.dismiss(auth.userId, generationId) }),
    );
  });

  app.get("/v1/plan-generations/:generationId", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    const { generationId } = parseWithSchema(generationParamSchema, request.params);
    return getPlanGenerationResponseSchema.parse({
      generation: await generationService.get(auth.userId, generationId),
    });
  });

  app.post("/v1/plan-generations/:generationId/retry", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    await requireSensitiveAssertion({
      request,
      auth,
      db,
      challenges: context.challenges,
      verifier: context.verifier,
      allowDevelopmentInstall:
        context.env.NODE_ENV !== "production" && context.env.DEV_SESSION_ENABLED,
    });
    const { generationId } = parseWithSchema(generationParamSchema, request.params);
    return idempotent(
      request,
      context,
      auth.userId,
      `POST /v1/plan-generations/${generationId}/retry`,
      {},
      async () =>
        retryPlanGenerationResponseSchema.parse({
          generation: await generationService.retry(auth.userId, generationId),
        }),
    );
  });

  app.get("/v1/plans/:planId/days/:dayNumber", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    const { planId, dayNumber } = parseWithSchema(dayParamSchema, request.params);
    return getStudyDayResponseSchema.parse({
      day: await studyService.getDay(auth.userId, planId, dayNumber, auth.timezone),
    });
  });

  app.put("/v1/plans/:planId/days/:dayNumber/steps/:step", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    const params = parseWithSchema(dayStepParamSchema, request.params);
    const body = parseWithSchema(completeStudyStepRequestSchema, request.body);
    if (body.step !== params.step)
      throw new AppError("VALIDATION_FAILED", "Step in path and body must match");
    return idempotent(
      request,
      context,
      auth.userId,
      `PUT /v1/plans/${params.planId}/days/${params.dayNumber}/steps/${params.step}`,
      body,
      async () =>
        completeStudyStepResponseSchema.parse(
          await studyService.completeStep(
            auth.userId,
            params.planId,
            params.dayNumber,
            params.step,
            auth.timezone,
          ),
        ),
    );
  });

  app.post("/v1/plans/:planId/days/:dayNumber/complete", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    const params = parseWithSchema(dayParamSchema, request.params);
    return idempotent(
      request,
      context,
      auth.userId,
      `POST /v1/plans/${params.planId}/days/${params.dayNumber}/complete`,
      {},
      async () =>
        completeStudyDayResponseSchema.parse(
          await studyService.completeDay(
            auth.userId,
            params.planId,
            params.dayNumber,
            auth.timezone,
          ),
        ),
    );
  });

  app.get("/v1/quizzes/:quizId/attempt", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    const { quizId } = parseWithSchema(quizParamSchema, request.params);
    return getQuizAttemptResponseSchema.parse(
      await quizService.getCurrentAttempt(auth.userId, quizId),
    );
  });

  app.post("/v1/quizzes/:quizId/attempts", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    const { quizId } = parseWithSchema(quizParamSchema, request.params);
    return idempotent(
      request,
      context,
      auth.userId,
      `POST /v1/quizzes/${quizId}/attempts`,
      {},
      async () =>
        startQuizAttemptResponseSchema.parse(
          await quizService.startAttempt(auth.userId, quizId, auth.timezone),
        ),
    );
  });

  app.get("/v1/quiz-attempts/:attemptId", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    const { attemptId } = parseWithSchema(attemptParamSchema, request.params);
    return getQuizAttemptResponseSchema.parse(await quizService.getAttempt(auth.userId, attemptId));
  });

  app.post("/v1/quiz-attempts/:attemptId/answers", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    const { attemptId } = parseWithSchema(attemptParamSchema, request.params);
    const body = parseWithSchema(submitQuizAnswerRequestSchema, request.body);
    return idempotent(
      request,
      context,
      auth.userId,
      `POST /v1/quiz-attempts/${attemptId}/answers`,
      body,
      async () =>
        submitQuizAnswerResponseSchema.parse(
          await quizService.submitAnswer(auth.userId, attemptId, body),
        ),
    );
  });

  app.post("/v1/quiz-attempts/:attemptId/complete", async (request) => {
    const auth = await requireAuth(request, db, context.jwt);
    const { attemptId } = parseWithSchema(attemptParamSchema, request.params);
    return idempotent(
      request,
      context,
      auth.userId,
      `POST /v1/quiz-attempts/${attemptId}/complete`,
      {},
      async () =>
        completeQuizAttemptResponseSchema.parse(
          await quizService.completeAttempt(auth.userId, attemptId),
        ),
    );
  });
}

async function idempotent<T>(
  request: FastifyRequest,
  context: AppContext,
  userId: string,
  path: string,
  body: unknown,
  action: (key: string) => Promise<T>,
): Promise<T> {
  const key = requireIdempotencyKey(request.headers["idempotency-key"]);
  return runIdempotent({
    db: context.database.db,
    userId,
    key,
    method: request.method,
    path,
    body,
    action: () => action(key),
  });
}

function readTimezone(request: FastifyRequest): string | undefined {
  const value = readSingleHeader(request, "x-client-timezone");
  if (!value) return undefined;
  if (!isValidTimeZone(value)) throw new AppError("VALIDATION_FAILED", "Invalid X-Client-Timezone");
  return value;
}

async function requireInstallationByKey(context: AppContext, keyId: string) {
  const rows = await context.database.db
    .select()
    .from(deviceInstallations)
    .where(
      and(eq(deviceInstallations.attestationKeyId, keyId), isNull(deviceInstallations.revokedAt)),
    )
    .limit(1);
  if (!rows[0]) throw new AppError("KEY_UNKNOWN", "Unknown App Attest key");
  return rows[0];
}

async function advanceCounter(
  context: AppContext,
  installationId: string,
  previousSignCount: number,
  nextSignCount: number,
  timezone?: string,
): Promise<void> {
  const rows = await context.database.db
    .update(deviceInstallations)
    .set({ signCount: nextSignCount, lastSeenAt: new Date(), ...(timezone ? { timezone } : {}) })
    .where(
      and(
        eq(deviceInstallations.id, installationId),
        eq(deviceInstallations.signCount, previousSignCount),
        isNull(deviceInstallations.revokedAt),
      ),
    )
    .returning({ id: deviceInstallations.id });
  if (!rows[0]) throw new AppError("ASSERTION_INVALID", "Assertion counter replay detected");
}
