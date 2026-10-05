import { z } from "zod";

import { apiIdSchema, isoDateTimeSchema, planLengthSchema } from "./common";

export const planGenerationStatusSchema = z.enum([
  "validating",
  "preparing",
  "processingSermon",
  "findingScripture",
  "writingDays",
  "buildingQuiz",
  "completed",
  "failed",
]);

export const planGenerationErrorSchema = z.object({
  code: z.enum([
    "invalidLink",
    "unsupportedSource",
    "videoUnavailable",
    "noCaptions",
    "network",
    "unknown",
  ]),
  message: z.string().min(1).max(1000),
});

export const planGenerationSchema = z.object({
  id: apiIdSchema,
  planId: apiIdSchema,
  sermonId: apiIdSchema.nullable(),
  planTitle: z.string().min(1).max(300),
  requestedLength: planLengthSchema,
  quickCheckEnabled: z.boolean(),
  status: planGenerationStatusSchema,
  attempt: z.number().int().positive(),
  error: planGenerationErrorSchema.nullable(),
  startedAt: isoDateTimeSchema.nullable(),
  finishedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const getPlanGenerationResponseSchema = z.object({ generation: planGenerationSchema });
export const retryPlanGenerationResponseSchema = z.object({ generation: planGenerationSchema });

export type ApiPlanGeneration = z.infer<typeof planGenerationSchema>;
