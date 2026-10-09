import { z } from "zod";

import {
  apiIdSchema,
  completedStudyStepsSchema,
  isoDateSchema,
  isoDateTimeSchema,
  planLengthSchema,
} from "./common.js";
import { sermonSummarySchema } from "./sermons.js";

export const planStatusSchema = z.enum(["ready", "active", "completed", "archived"]);
export const planDayStatusSchema = z.enum(["locked", "available", "inProgress", "completed"]);
export const quickCheckStatusSchema = z.enum(["notStarted", "inProgress", "completed"]);

export const quickCheckStandingSchema = z.object({
  id: apiIdSchema,
  status: quickCheckStatusSchema,
  questionCount: z.number().int().nonnegative(),
  answeredCount: z.number().int().nonnegative(),
  correctCount: z.number().int().nonnegative(),
});

export const planProgressSchema = z.object({
  completedDays: z.number().int().nonnegative(),
  currentDayNumber: z.number().int().min(1).max(7).nullable(),
  percentage: z.number().int().min(0).max(100),
});

export const planCurrentDaySchema = z.object({
  id: apiIdSchema,
  dayNumber: z.number().int().min(1).max(7),
  title: z.string().min(1).max(300),
  estimatedMinutes: z.number().int().positive(),
  scheduledOn: isoDateSchema.nullable(),
  status: planDayStatusSchema,
  quickCheck: quickCheckStandingSchema.nullable(),
});

export const planSummarySchema = z.object({
  id: apiIdSchema,
  title: z.string().min(1).max(300),
  status: planStatusSchema,
  lengthDays: planLengthSchema,
  estimatedMinutes: z.number().int().positive(),
  quickCheckEnabled: z.boolean(),
  isSample: z.boolean(),
  saved: z.boolean(),
  sermon: sermonSummarySchema,
  progress: planProgressSchema,
  currentDay: planCurrentDaySchema.nullable(),
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
  /** Each with its heading; one from a plan written before headings has none. */
  paragraphs: z
    .array(z.object({ heading: z.string().min(1).nullable(), content: z.string().min(1) }))
    .min(1),
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
  status: planDayStatusSchema,
  completedSteps: completedStudyStepsSchema,
  scheduledOn: isoDateSchema.nullable(),
  startedAt: isoDateTimeSchema.nullable(),
  completedAt: isoDateTimeSchema.nullable(),
});

export const planDaySummarySchema = z.object({
  id: apiIdSchema,
  dayNumber: z.number().int().min(1).max(7),
  estimatedMinutes: z.number().int().positive(),
  reading: dayReadingSchema,
  scriptureReference: scriptureReferenceSchema,
  reflectionPrompts: z.array(reflectionPromptSchema),
  prayer: prayerContentSchema,
  quickCheckId: apiIdSchema.nullable(),
  quickCheck: quickCheckStandingSchema.nullable(),
  progress: planDayProgressSchema,
});

/** A Scripture the sermon names. Verse bounds are null when it names only the chapter. */
export const planScriptureCitationSchema = z.object({
  reference: z.string().min(1).max(100),
  book: z.string().min(1).max(80),
  chapter: z.number().int().positive(),
  verseStart: z.number().int().positive().nullable(),
  verseEnd: z.number().int().positive().nullable(),
});

/** Plan Overview's About This Plan section. Null for plans generated before it existed. */
export const planAboutSchema = z.object({
  overview: z.array(z.string().min(1)).min(1),
  scripturesReferenced: z.array(planScriptureCitationSchema),
  keyTakeaways: z.array(z.string().min(1)).min(1),
});

export const planDetailSchema = planSummarySchema.extend({
  about: planAboutSchema.nullable(),
  days: z.array(planDaySummarySchema).min(1).max(7),
});

export const listPlansResponseSchema = z.object({ plans: z.array(planSummarySchema) });
export const getPlanResponseSchema = z.object({ plan: planDetailSchema });

/** A search of the reader's own plans: words, at least one character. */
export const searchPlansQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(120),
    limit: z.coerce.number().int().min(1).max(30).default(20),
  })
  .strict();

/**
 * The reader's plans that match, best first: a title starting with the words,
 * then a word in it, then anywhere in it, then the church, then a day's
 * passage or heading. `matched` is the text the words were found in.
 */
export const searchPlansResponseSchema = z.object({
  results: z.array(z.object({ plan: planSummarySchema, matched: z.string().min(1).max(300) })),
});

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
/** A plan after a reset: back to not started, with its reflection questions' ids for the app to clear. */
export const resetPlanResponseSchema = z.object({
  plan: planSummarySchema,
  reflectionIds: z.array(apiIdSchema),
});
export const savePlanResponseSchema = z.object({ saved: z.literal(true) });
export const removeSavedPlanResponseSchema = z.object({ saved: z.literal(false) });

export type ApiPlanSummary = z.infer<typeof planSummarySchema>;
export type ApiPlanDetail = z.infer<typeof planDetailSchema>;
export type ApiPlanAbout = z.infer<typeof planAboutSchema>;
export type ApiPlanDaySummary = z.infer<typeof planDaySummarySchema>;
export type ApiQuickCheckStanding = z.infer<typeof quickCheckStandingSchema>;
export type SearchPlansResponse = z.infer<typeof searchPlansResponseSchema>;
export type CreatePlanRequest = z.infer<typeof createPlanRequestSchema>;
