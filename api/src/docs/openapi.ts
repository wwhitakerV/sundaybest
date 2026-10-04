import type { FastifyInstance } from "fastify";
import { z, type ZodType } from "zod";

import {
  apiErrorEnvelopeSchema,
  archivePlanResponseSchema,
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
  getPlanResponseSchema,
  getQuizAttemptResponseSchema,
  getRemindersResponseSchema,
  getSettingsResponseSchema,
  getStudyDayResponseSchema,
  listPlansResponseSchema,
  mutationAckSchema,
  refreshRequestSchema,
  removeSavedPlanResponseSchema,
  resolveSermonRequestSchema,
  resolveSermonResponseSchema,
  searchSermonsResponseSchema,
  progressResponseSchema,
  retryPlanGenerationResponseSchema,
  savePlanResponseSchema,
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
} from "../contracts/index.js";

const devSessionRequestSchema = z
  .object({
    installationId: z
      .string()
      .min(1)
      .max(128)
      .meta({
        description: "Stable development-install identifier. Reusing it reuses the same anonymous user.",
        examples: ["swagger-local"],
      })
      .optional(),
    timezone: z
      .string()
      .min(1)
      .meta({
        description: "IANA timezone",
        examples: ["America/Chicago"],
      })
      .optional(),
  })
  .strict();

const emptyObjectSchema = z.object({}).strict();

function jsonSchema(schema: ZodType): Record<string, unknown> {
  const converted = z.toJSONSchema(schema) as Record<string, unknown>;

  const { $schema: _ignored, ...rest } = converted;

  return rest;
}

const ref = (name: string): Record<string, string> => ({
  $ref: `#/components/schemas/${name}`,
});

const parameterRef = (name: string): Record<string, string> => ({
  $ref: `#/components/parameters/${name}`,
});

const responseRef = (name: string): Record<string, string> => ({
  $ref: `#/components/responses/${name}`,
});

function requestBody(
  schemaName: string,
  required = true,
  example?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    required,
    content: {
      "application/json": {
        schema: ref(schemaName),
        ...(example ? { example } : {}),
      },
    },
  };
}

function ok(description: string, schemaName?: string): Record<string, unknown> {
  if (!schemaName) {
    return { description };
  }

  return {
    description,
    content: {
      "application/json": {
        schema: ref(schemaName),
      },
    },
  };
}

const commonErrors = {
  "400": responseRef("BadRequest"),
  "401": responseRef("Unauthorized"),
  "404": responseRef("NotFound"),
  "409": responseRef("Conflict"),
  "429": responseRef("RateLimited"),
  "500": responseRef("InternalError"),
};

const auth = [{ bearerAuth: [] }];

export function buildOpenApiDocument(): Record<string, unknown> {
  return {
    openapi: "3.1.0",

    info: {
      title: "SundayBest API",
      version: "0.1.0",
      description:
        "Interactive contract for the SundayBest mobile API. In local development, POST /v1/dev/session automatically authorizes Swagger with the returned accessToken. Swagger also supplies the browser's IANA timezone on requests. Mutating endpoints still require a unique Idempotency-Key. Sensitive production mutations additionally require App Attest assertion headers.",
    },

    servers: [
      {
        url: "/",
        description: "Current API server",
      },
    ],

    tags: [
      {
        name: "Health",
        description: "Liveness and database readiness",
      },
      {
        name: "Auth",
        description: "App Attest, session bootstrap, refresh and revocation",
      },
      {
        name: "Development",
        description: "Local-development helpers; not registered in production",
      },
      {
        name: "User",
        description: "Anonymous user profile and onboarding",
      },
      {
        name: "Settings",
        description: "User settings and reminder preferences",
      },
      {
        name: "Progress",
        description: "Study history, streaks, totals, and what is up next",
      },
      {
        name: "Sermons",
        description: "YouTube sermon resolution",
      },
      {
        name: "Plans",
        description: "Plans, enrollments, saved state and generation",
      },
      {
        name: "Study",
        description: "Daily study content and progress",
      },
      {
        name: "Quick Check",
        description: "Quiz attempts, answers and scoring",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Paste the accessToken returned by POST /v1/dev/session during local development.",
        },
      },

      parameters: {
        IdempotencyKey: {
          name: "Idempotency-Key",
          in: "header",
          required: true,
          description:
            "Unique key for this logical mutation. Reuse the same key only when retrying the exact same request.",
          schema: {
            type: "string",
            minLength: 8,
            maxLength: 200,
          },
          example: "swagger-test-0001",
        },

        ClientTimezone: {
          name: "X-Client-Timezone",
          in: "header",
          required: false,
          description: "IANA timezone used for local-day pacing and scheduling.",
          schema: {
            type: "string",
            example: "America/Chicago",
          },
        },

        AttestationKeyId: {
          name: "X-Attestation-KeyId",
          in: "header",
          required: true,
          description: "App Attest key identifier for sensitive mutations.",
          schema: {
            type: "string",
          },
        },

        AttestationAssertion: {
          name: "X-Attestation-Assertion",
          in: "header",
          required: true,
          description: "Request-bound App Attest assertion for sensitive mutations.",
          schema: {
            type: "string",
          },
        },

        AttestationChallenge: {
          name: "X-Attestation-Challenge",
          in: "header",
          required: true,
          description: "Fresh challenge consumed by the request-bound App Attest assertion.",
          schema: {
            type: "string",
          },
        },

        PlanId: {
          name: "planId",
          in: "path",
          required: true,
          schema: {
            type: "string",
            format: "uuid",
          },
        },

        GenerationId: {
          name: "generationId",
          in: "path",
          required: true,
          schema: {
            type: "string",
            format: "uuid",
          },
        },

        QuizId: {
          name: "quizId",
          in: "path",
          required: true,
          schema: {
            type: "string",
            format: "uuid",
          },
        },

        AttemptId: {
          name: "attemptId",
          in: "path",
          required: true,
          schema: {
            type: "string",
            format: "uuid",
          },
        },

        DayNumber: {
          name: "dayNumber",
          in: "path",
          required: true,
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 7,
          },
        },

        StudyStep: {
          name: "step",
          in: "path",
          required: true,
          schema: {
            type: "string",
            enum: ["read", "scripture", "reflect", "pray"],
          },
        },

        ReminderKind: {
          name: "kind",
          in: "path",
          required: true,
          schema: {
            type: "string",
            enum: ["dailyStudy", "quickCheck"],
          },
        },
      },

      responses: {
        BadRequest: errorResponse("Request validation failed"),
        Unauthorized: errorResponse("Authentication failed"),
        NotFound: errorResponse("Resource not found"),
        Conflict: errorResponse("Request conflicts with current resource state"),
        RateLimited: errorResponse(
          "Request is being rate-limited or an idempotent request is still processing",
        ),
        InternalError: errorResponse("Internal server error"),
      },

      schemas: {
        ApiErrorEnvelope: jsonSchema(apiErrorEnvelopeSchema),
        MutationAck: jsonSchema(mutationAckSchema),
        EmptyObject: jsonSchema(emptyObjectSchema),

        DevSessionRequest: jsonSchema(devSessionRequestSchema),

        ChallengeRequest: jsonSchema(challengeRequestSchema),
        ChallengeResponse: jsonSchema(challengeResponseSchema),

        VerifyAttestationRequest: jsonSchema(verifyAttestationRequestSchema),

        SessionCredentials: jsonSchema(sessionCredentialsSchema),

        RefreshRequest: jsonSchema(refreshRequestSchema),

        BootstrapSessionRequest: jsonSchema(bootstrapSessionRequestSchema),

        GetMeResponse: jsonSchema(getMeResponseSchema),

        UpdateMeRequest: jsonSchema(updateMeRequestSchema),

        CompleteOnboardingResponse: jsonSchema(completeOnboardingResponseSchema),

        GetSettingsResponse: jsonSchema(getSettingsResponseSchema),

        UpdateSettingsRequest: jsonSchema(updateSettingsRequestSchema),

        GetRemindersResponse: jsonSchema(getRemindersResponseSchema),

        UpdateReminderRequest: jsonSchema(updateReminderRequestSchema),

        UpdateReminderResponse: jsonSchema(updateReminderResponseSchema),

        ResolveSermonRequest: jsonSchema(resolveSermonRequestSchema),

        ResolveSermonResponse: jsonSchema(resolveSermonResponseSchema),
        SearchSermonsResponse: jsonSchema(searchSermonsResponseSchema),
        ProgressResponse: jsonSchema(progressResponseSchema),

        ListPlansResponse: jsonSchema(listPlansResponseSchema),

        GetPlanResponse: jsonSchema(getPlanResponseSchema),

        CreatePlanRequest: jsonSchema(createPlanRequestSchema),

        CreatePlanResponse: jsonSchema(createPlanResponseSchema),

        StartPlanResponse: jsonSchema(startPlanResponseSchema),

        ArchivePlanResponse: jsonSchema(archivePlanResponseSchema),

        SavePlanResponse: jsonSchema(savePlanResponseSchema),

        RemoveSavedPlanResponse: jsonSchema(removeSavedPlanResponseSchema),

        GetPlanGenerationResponse: jsonSchema(getPlanGenerationResponseSchema),

        RetryPlanGenerationResponse: jsonSchema(retryPlanGenerationResponseSchema),

        GetStudyDayResponse: jsonSchema(getStudyDayResponseSchema),

        CompleteStudyStepRequest: jsonSchema(completeStudyStepRequestSchema),

        CompleteStudyStepResponse: jsonSchema(completeStudyStepResponseSchema),

        CompleteStudyDayResponse: jsonSchema(completeStudyDayResponseSchema),

        StartQuizAttemptResponse: jsonSchema(startQuizAttemptResponseSchema),

        GetQuizAttemptResponse: jsonSchema(getQuizAttemptResponseSchema),

        SubmitQuizAnswerRequest: jsonSchema(submitQuizAnswerRequestSchema),

        SubmitQuizAnswerResponse: jsonSchema(submitQuizAnswerResponseSchema),

        CompleteQuizAttemptResponse: jsonSchema(completeQuizAttemptResponseSchema),
      },
    },

    paths: {
      "/health/live": {
        get: {
          tags: ["Health"],
          operationId: "healthLive",
          summary: "Liveness check",
          responses: {
            "200": ok("API process is alive"),
          },
        },
      },

      "/health/ready": {
        get: {
          tags: ["Health"],
          operationId: "healthReady",
          summary: "Readiness check",
          responses: {
            "200": ok("API and PostgreSQL are ready"),
            "503": {
              description: "PostgreSQL is not reachable",
            },
          },
        },
      },

      "/v1/dev/session": {
        post: {
          tags: ["Development"],
          operationId: "createDevelopmentSession",
          summary: "Create a local anonymous development session",
          description:
            "Available only when NODE_ENV is not production and DEV_SESSION_ENABLED=true. Swagger automatically authorizes itself with the returned accessToken.",
          requestBody: requestBody("DevSessionRequest", false, {
            installationId: "swagger-local",
            timezone: "America/Chicago",
          }),
          responses: {
            "200": ok("Development session created", "SessionCredentials"),
            ...commonErrors,
          },
        },
      },

      "/v1/attest/challenge": {
        post: {
          tags: ["Auth"],
          operationId: "createAttestChallenge",
          summary: "Issue a one-time App Attest challenge",
          requestBody: requestBody("ChallengeRequest"),
          responses: {
            "200": ok("Challenge issued", "ChallengeResponse"),
            ...commonErrors,
          },
        },
      },

      "/v1/attest/verify": {
        post: {
          tags: ["Auth"],
          operationId: "verifyAttestation",
          summary: "Verify a new App Attest key and create an anonymous session",
          parameters: [parameterRef("ClientTimezone")],
          requestBody: requestBody("VerifyAttestationRequest"),
          responses: {
            "200": ok("Anonymous session created", "SessionCredentials"),
            ...commonErrors,
          },
        },
      },

      "/v1/session/bootstrap": {
        post: {
          tags: ["Auth"],
          operationId: "bootstrapSession",
          summary: "Restore a session using an existing attested key",
          parameters: [parameterRef("ClientTimezone")],
          requestBody: requestBody("BootstrapSessionRequest"),
          responses: {
            "200": ok("Session restored", "SessionCredentials"),
            ...commonErrors,
          },
        },
      },

      "/v1/session/refresh": {
        post: {
          tags: ["Auth"],
          operationId: "refreshSession",
          summary: "Rotate access and refresh credentials",
          parameters: [parameterRef("ClientTimezone")],
          requestBody: requestBody("RefreshRequest"),
          responses: {
            "200": ok("Session credentials rotated", "SessionCredentials"),
            ...commonErrors,
          },
        },
      },

      "/v1/session/revoke": {
        post: {
          tags: ["Auth"],
          operationId: "revokeSession",
          summary: "Revoke the current installation session",
          security: auth,
          requestBody: requestBody("EmptyObject", false),
          responses: {
            "200": ok("Session revoked", "MutationAck"),
            ...commonErrors,
          },
        },
      },

      "/v1/me": {
        get: {
          tags: ["User"],
          operationId: "getMe",
          summary: "Get the current user",
          security: auth,
          responses: {
            "200": ok("Current user", "GetMeResponse"),
            ...commonErrors,
          },
        },

        patch: {
          tags: ["User"],
          operationId: "updateMe",
          summary: "Update the current user",
          security: auth,
          parameters: [parameterRef("IdempotencyKey")],
          requestBody: requestBody("UpdateMeRequest"),
          responses: {
            "200": ok("User updated", "GetMeResponse"),
            ...commonErrors,
          },
        },

        delete: {
          tags: ["User"],
          operationId: "deleteMe",
          summary: "Delete the current user",
          description:
            "Sensitive mutation. Requires a request-bound App Attest assertion in addition to bearer authentication.",
          security: auth,
          parameters: sensitiveParameters(),
          responses: {
            "200": ok("User deleted", "MutationAck"),
            ...commonErrors,
          },
        },
      },

      "/v1/me/onboarding/complete": {
        post: {
          tags: ["User"],
          operationId: "completeOnboarding",
          summary: "Mark onboarding complete",
          security: auth,
          parameters: [parameterRef("IdempotencyKey")],
          responses: {
            "200": ok("Onboarding completed", "CompleteOnboardingResponse"),
            ...commonErrors,
          },
        },
      },

      "/v1/me/settings": {
        get: {
          tags: ["Settings"],
          operationId: "getSettings",
          summary: "Get user settings",
          security: auth,
          responses: {
            "200": ok("User settings", "GetSettingsResponse"),
            ...commonErrors,
          },
        },

        patch: {
          tags: ["Settings"],
          operationId: "updateSettings",
          summary: "Update user settings",
          security: auth,
          parameters: [parameterRef("IdempotencyKey")],
          requestBody: requestBody("UpdateSettingsRequest"),
          responses: {
            "200": ok("Settings updated", "GetSettingsResponse"),
            ...commonErrors,
          },
        },
      },

      "/v1/me/reminders": {
        get: {
          tags: ["Settings"],
          operationId: "listReminders",
          summary: "List reminder preferences",
          security: auth,
          responses: {
            "200": ok("Reminder preferences", "GetRemindersResponse"),
            ...commonErrors,
          },
        },
      },

      "/v1/me/reminders/{kind}": {
        put: {
          tags: ["Settings"],
          operationId: "updateReminder",
          summary: "Update a reminder preference",
          security: auth,
          parameters: [parameterRef("ReminderKind"), parameterRef("IdempotencyKey")],
          requestBody: requestBody("UpdateReminderRequest"),
          responses: {
            "200": ok("Reminder updated", "UpdateReminderResponse"),
            ...commonErrors,
          },
        },
      },

      "/v1/sermons/search": {
        get: {
          tags: ["Sermons"],
          operationId: "searchSermons",
          summary: "Search sermon videos",
          description:
            "Searches the SundayBest sermon catalog and, when YOUTUBE_API_KEY is configured, YouTube as well.",
          security: auth,
          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              schema: { type: "string", minLength: 2, maxLength: 120 },
              example: "temptation",
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 20, default: 10 },
            },
          ],
          responses: {
            "200": ok("Sermon search results", "SearchSermonsResponse"),
            ...commonErrors,
          },
        },
      },

      "/v1/sermons/resolve": {
        post: {
          tags: ["Sermons"],
          operationId: "resolveSermon",
          summary: "Resolve a YouTube URL into sermon metadata",
          security: auth,
          parameters: [parameterRef("IdempotencyKey")],
          requestBody: requestBody("ResolveSermonRequest"),
          responses: {
            "200": ok("Sermon resolved", "ResolveSermonResponse"),
            ...commonErrors,
          },
        },
      },

      "/v1/me/progress": {
        get: {
          tags: ["Progress"],
          operationId: "getProgress",
          summary: "Get progress dashboard data",
          description:
            "Returns the requested seven-day activity window plus streak, totals, latest Quick Check score, and the active plan's next day.",
          security: auth,
          parameters: [
            {
              name: "weekStart",
              in: "query",
              required: false,
              description: "First calendar date of the seven-day window. The client normally sends Sunday.",
              schema: { type: "string", format: "date" },
              example: "2026-10-04",
            },
          ],
          responses: {
            "200": ok("Progress dashboard", "ProgressResponse"),
            ...commonErrors,
          },
        },
      },

      "/v1/plans": {
        get: {
          tags: ["Plans"],
          operationId: "listPlans",
          summary: "List plans visible to the current user",
          security: auth,
          responses: {
            "200": ok("Plans", "ListPlansResponse"),
            ...commonErrors,
          },
        },

        post: {
          tags: ["Plans"],
          operationId: "createPlan",
          summary: "Create a plan-generation job",
          description:
            "Sensitive mutation. Queues asynchronous generation and returns stable plan/generation IDs.",
          security: auth,
          parameters: sensitiveParameters(),
          requestBody: requestBody("CreatePlanRequest"),
          responses: {
            "200": ok("Plan generation accepted", "CreatePlanResponse"),
            ...commonErrors,
          },
        },
      },

      "/v1/plans/{planId}": {
        get: {
          tags: ["Plans"],
          operationId: "getPlan",
          summary: "Get plan detail",
          security: auth,
          parameters: [parameterRef("PlanId")],
          responses: {
            "200": ok("Plan detail", "GetPlanResponse"),
            ...commonErrors,
          },
        },
      },

      "/v1/plans/{planId}/start": {
        post: {
          tags: ["Plans"],
          operationId: "startPlan",
          summary: "Start a plan and schedule its days",
          security: auth,
          parameters: [
            parameterRef("PlanId"),
            parameterRef("IdempotencyKey"),
            parameterRef("ClientTimezone"),
          ],
          responses: {
            "200": ok("Plan started", "StartPlanResponse"),
            ...commonErrors,
          },
        },
      },

      "/v1/plans/{planId}/archive": {
        post: {
          tags: ["Plans"],
          operationId: "archivePlan",
          summary: "Archive a plan",
          security: auth,
          parameters: [parameterRef("PlanId"), parameterRef("IdempotencyKey")],
          responses: {
            "200": ok("Plan archived", "ArchivePlanResponse"),
            ...commonErrors,
          },
        },
      },

      "/v1/plans/{planId}/saved": {
        put: {
          tags: ["Plans"],
          operationId: "savePlan",
          summary: "Save a plan",
          security: auth,
          parameters: [parameterRef("PlanId"), parameterRef("IdempotencyKey")],
          responses: {
            "200": ok("Plan saved", "SavePlanResponse"),
            ...commonErrors,
          },
        },

        delete: {
          tags: ["Plans"],
          operationId: "unsavePlan",
          summary: "Remove a plan from saved",
          security: auth,
          parameters: [parameterRef("PlanId"), parameterRef("IdempotencyKey")],
          responses: {
            "200": ok("Plan removed from saved", "RemoveSavedPlanResponse"),
            ...commonErrors,
          },
        },
      },

      "/v1/plan-generations/{generationId}": {
        get: {
          tags: ["Plans"],
          operationId: "getPlanGeneration",
          summary: "Get plan-generation status",
          security: auth,
          parameters: [parameterRef("GenerationId")],
          responses: {
            "200": ok("Generation status", "GetPlanGenerationResponse"),
            ...commonErrors,
          },
        },
      },

      "/v1/plan-generations/{generationId}/retry": {
        post: {
          tags: ["Plans"],
          operationId: "retryPlanGeneration",
          summary: "Retry a failed plan generation",
          description: "Sensitive mutation. Requeues an eligible failed generation.",
          security: auth,
          parameters: [parameterRef("GenerationId"), ...sensitiveParameters()],
          responses: {
            "200": ok("Generation requeued", "RetryPlanGenerationResponse"),
            ...commonErrors,
          },
        },
      },

      "/v1/plans/{planId}/days/{dayNumber}": {
        get: {
          tags: ["Study"],
          operationId: "getStudyDay",
          summary: "Get a study day in the user's selected Bible translation",
          security: auth,
          parameters: [
            parameterRef("PlanId"),
            parameterRef("DayNumber"),
            parameterRef("ClientTimezone"),
          ],
          responses: {
            "200": ok("Study day", "GetStudyDayResponse"),
            ...commonErrors,
          },
        },
      },

      "/v1/plans/{planId}/days/{dayNumber}/steps/{step}": {
        put: {
          tags: ["Study"],
          operationId: "completeStudyStep",
          summary: "Complete a study step",
          security: auth,
          parameters: [
            parameterRef("PlanId"),
            parameterRef("DayNumber"),
            parameterRef("StudyStep"),
            parameterRef("IdempotencyKey"),
            parameterRef("ClientTimezone"),
          ],
          requestBody: requestBody("CompleteStudyStepRequest"),
          responses: {
            "200": ok("Step completed", "CompleteStudyStepResponse"),
            ...commonErrors,
          },
        },
      },

      "/v1/plans/{planId}/days/{dayNumber}/complete": {
        post: {
          tags: ["Study"],
          operationId: "completeStudyDay",
          summary: "Complete a study day",
          security: auth,
          parameters: [
            parameterRef("PlanId"),
            parameterRef("DayNumber"),
            parameterRef("IdempotencyKey"),
            parameterRef("ClientTimezone"),
          ],
          responses: {
            "200": ok("Day completed", "CompleteStudyDayResponse"),
            ...commonErrors,
          },
        },
      },

      "/v1/quizzes/{quizId}/attempts": {
        post: {
          tags: ["Quick Check"],
          operationId: "startQuizAttempt",
          summary: "Start or resume a Quick Check attempt",
          security: auth,
          parameters: [
            parameterRef("QuizId"),
            parameterRef("IdempotencyKey"),
            parameterRef("ClientTimezone"),
          ],
          responses: {
            "200": ok("Quiz and attempt state", "StartQuizAttemptResponse"),
            ...commonErrors,
          },
        },
      },

      "/v1/quiz-attempts/{attemptId}": {
        get: {
          tags: ["Quick Check"],
          operationId: "getQuizAttempt",
          summary: "Get Quick Check attempt state",
          security: auth,
          parameters: [parameterRef("AttemptId")],
          responses: {
            "200": ok("Quiz and attempt state", "GetQuizAttemptResponse"),
            ...commonErrors,
          },
        },
      },

      "/v1/quiz-attempts/{attemptId}/answers": {
        post: {
          tags: ["Quick Check"],
          operationId: "submitQuizAnswer",
          summary: "Submit an answer and receive immediate feedback",
          security: auth,
          parameters: [parameterRef("AttemptId"), parameterRef("IdempotencyKey")],
          requestBody: requestBody("SubmitQuizAnswerRequest"),
          responses: {
            "200": ok("Answer feedback", "SubmitQuizAnswerResponse"),
            ...commonErrors,
          },
        },
      },

      "/v1/quiz-attempts/{attemptId}/complete": {
        post: {
          tags: ["Quick Check"],
          operationId: "completeQuizAttempt",
          summary: "Complete a Quick Check attempt and calculate its score",
          security: auth,
          parameters: [parameterRef("AttemptId"), parameterRef("IdempotencyKey")],
          responses: {
            "200": ok("Attempt completed", "CompleteQuizAttemptResponse"),
            ...commonErrors,
          },
        },
      },
    },
  };
}

export async function registerApiDocs(app: FastifyInstance): Promise<void> {
  const document = buildOpenApiDocument();

  app.get("/openapi.json", async (_request, reply) => {
    return reply.header("cache-control", "no-store").send(document);
  });

  app.get("/docs", async (_request, reply) => {
    return reply
      .type("text/html; charset=utf-8")
      .header("cache-control", "no-store")
      .send(swaggerHtml());
  });
}

function errorResponse(description: string): Record<string, unknown> {
  return {
    description,
    content: {
      "application/json": {
        schema: ref("ApiErrorEnvelope"),
      },
    },
  };
}

function sensitiveParameters(): Record<string, unknown>[] {
  return [
    parameterRef("IdempotencyKey"),
    parameterRef("AttestationKeyId"),
    parameterRef("AttestationAssertion"),
    parameterRef("AttestationChallenge"),
  ];
}

function swaggerHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1"
    />
    <title>SundayBest API Docs</title>

    <link
      rel="stylesheet"
      href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
    />

    <style>
      html {
        box-sizing: border-box;
        overflow-y: scroll;
      }

      *,
      *::before,
      *::after {
        box-sizing: inherit;
      }

      body {
        margin: 0;
        background: #fafafa;
      }

      .swagger-ui .topbar {
        display: none;
      }

      .swagger-ui .info {
        margin: 32px 0 24px;
      }
    </style>
  </head>

  <body>
    <div id="swagger-ui"></div>

    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>

    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: "/openapi.json",
          dom_id: "#swagger-ui",

          deepLinking: true,
          displayRequestDuration: true,
          filter: true,
          persistAuthorization: true,
          tryItOutEnabled: true,

          docExpansion: "list",
          defaultModelsExpandDepth: 2,
          defaultModelExpandDepth: 3,

          requestInterceptor: (request) => {
            const timezone =
              Intl.DateTimeFormat()
                .resolvedOptions()
                .timeZone || "UTC";

            const url = request.url || "";

            request.headers =
              request.headers || {};

            if (
              !request.headers[
                "X-Client-Timezone"
              ]
            ) {
              request.headers[
                "X-Client-Timezone"
              ] = timezone;
            }

            if (
              url.includes(
                "/v1/dev/session",
              )
            ) {
              try {
                let body = {};

                if (
                  typeof request.body ===
                    "string" &&
                  request.body.trim().length >
                    0
                ) {
                  body = JSON.parse(
                    request.body,
                  );
                } else if (
                  request.body &&
                  typeof request.body ===
                    "object"
                ) {
                  body = request.body;
                }

                body.timezone =
                  timezone;

                request.body =
                  JSON.stringify(body);

                request.headers[
                  "Content-Type"
                ] =
                  "application/json";
              } catch (error) {
                console.warn(
                  "[SundayBest Swagger] Could not populate the development-session timezone.",
                  error,
                );
              }
            }

            return request;
          },

          responseInterceptor: (
            response,
          ) => {
            const url =
              response.url || "";

            const status = Number(
              response.status || 0,
            );

            const isSuccessful =
              status >= 200 &&
              status < 300;

            const isSessionResponse =
              url.includes(
                "/v1/dev/session",
              ) ||
              url.includes(
                "/v1/session/refresh",
              ) ||
              url.includes(
                "/v1/session/bootstrap",
              ) ||
              url.includes(
                "/v1/attest/verify",
              );

            if (
              !isSuccessful ||
              !isSessionResponse
            ) {
              return response;
            }

            try {
              const rawBody =
                response.body ??
                response.data;

              const body =
                typeof rawBody ===
                "string"
                  ? JSON.parse(rawBody)
                  : rawBody;

              const accessToken =
                body?.accessToken;

              if (
                accessToken &&
                window.ui?.authActions
              ) {
                window.ui.authActions.authorize(
                  {
                    bearerAuth: {
                      name: "bearerAuth",

                      schema: {
                        type: "http",
                        scheme:
                          "bearer",
                        bearerFormat:
                          "JWT",
                      },

                      value:
                        accessToken,
                    },
                  },
                );

                console.info(
                  "[SundayBest Swagger] Bearer session authorized automatically.",
                );
              }
            } catch (error) {
              console.warn(
                "[SundayBest Swagger] Could not automatically authorize the session.",
                error,
              );
            }

            return response;
          },

          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset,
          ],

          layout:
            "StandaloneLayout",
        });
      };
    </script>
  </body>
</html>`;
}
