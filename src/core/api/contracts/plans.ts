import { z } from "zod";

import {
  apiIdSchema,
  completedStudyStepsSchema,
  isoDateSchema,
  isoDateTimeSchema,
  planLengthSchema,
} from "./common";
import { sermonSummarySchema } from "./sermons";

export const planStatusSchema = z.enum(["ready", "active", "completed", "archived"]);

export const planProgressSchema = z.object({
  completedDays: z.number().int().nonnegative(),
  currentDayNumber: z.number().int().min(1).max(7).nullable(),
  percentage: z.number().int().min(0).max(100),
});

export const planSummarySchema = z.object({
  id: apiIdSchema,
  title: z.string().min(1).max(300),
  status: planStatusSchema,
  lengthDays: planLengthSchema,
  quickCheckEnabled: z.boolean(),
  isSample: z.boolean(),
  saved: z.boolean(),
  sermon: sermonSummarySchema,
  progress: planProgressSchema,
  startDate: isoDateSchema.nullable(),
  startedAt: isoDateTimeSchema.nullable(),
  completedAt: isoDateTimeSchema.nullable(),
  archivedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const sermonClipSchema = z.object({
  startSeconds: z.number().nonnegative(),
  endSeconds: z.number().nonnegative().nullable(),
});

export const dayReadingSchema = z.object({
  title: z.string().min(1).max(300),
  paragraphs: z.array(z.string().min(1)).min(1),
  sermonQuote: z.string().nullable(),
  sermonClip: sermonClipSchema.nullable(),
});

export const scriptureReferenceSchema = z.object({
  id: apiIdSchema,
  reference: z.string().min(1).max(100),
  book: z.string().min(1).max(80),
  chapter: z.number().int().positive(),
  verseStart: z.number().int().positive(),
  verseEnd: z.number().int().positive(),
});

export const reflectionPromptSchema = z.object({
  id: apiIdSchema,
  order: z.number().int().positive(),
  question: z.string().min(1).max(1000),
});

export const prayerContentSchema = z.object({
  id: apiIdSchema,
  title: z.string().min(1).max(200),
  text: z.string().min(1),
});

export const planDayProgressSchema = z.object({
  completedSteps: completedStudyStepsSchema,
  scheduledOn: isoDateSchema.nullable(),
  startedAt: isoDateTimeSchema.nullable(),
  completedAt: isoDateTimeSchema.nullable(),
});

export const planDaySummarySchema = z.object({
  id: apiIdSchema,
  dayNumber: z.number().int().min(1).max(7),
  reading: dayReadingSchema,
  scriptureReference: scriptureReferenceSchema,
  reflectionPrompts: z.array(reflectionPromptSchema),
  prayer: prayerContentSchema,
  quickCheckId: apiIdSchema.nullable(),
  progress: planDayProgressSchema,
});

export const planDetailSchema = planSummarySchema.extend({
  days: z.array(planDaySummarySchema).min(1).max(7),
});

export const listPlansResponseSchema = z.object({ plans: z.array(planSummarySchema) });
export const getPlanResponseSchema = z.object({ plan: planDetailSchema });

export const createPlanRequestSchema = z
  .object({
    sermonId: apiIdSchema,
    lengthDays: planLengthSchema,
    quickCheckEnabled: z.boolean(),
  })
  .strict();

export const createPlanResponseSchema = z.object({
  planId: apiIdSchema,
  generationId: apiIdSchema,
});

export const startPlanResponseSchema = z.object({ plan: planDetailSchema });
export const archivePlanResponseSchema = z.object({ plan: planSummarySchema });
export const savePlanResponseSchema = z.object({ saved: z.literal(true) });
export const removeSavedPlanResponseSchema = z.object({ saved: z.literal(false) });

export type ApiPlanSummary = z.infer<typeof planSummarySchema>;
export type ApiPlanDetail = z.infer<typeof planDetailSchema>;
export type CreatePlanRequest = z.infer<typeof createPlanRequestSchema>;
