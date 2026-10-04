import { z } from "zod";

import { apiIdSchema, isoDateSchema, isoDateTimeSchema } from "./common";
import { planSummarySchema } from "./plans";

export const progressDayActivitySchema = z.object({
  date: isoDateSchema,
  completedDayCount: z.number().int().nonnegative(),
});

export const streakSchema = z.object({
  current: z.number().int().nonnegative(),
  longest: z.number().int().nonnegative(),
});

export const progressTotalsSchema = z.object({
  completedDayCount: z.number().int().nonnegative(),
  completedPlanCount: z.number().int().nonnegative(),
});

export const latestQuickCheckScoreSchema = z.object({
  attemptId: apiIdSchema,
  quizId: apiIdSchema,
  correct: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  percentage: z.number().int().min(0).max(100),
  completedAt: isoDateTimeSchema,
});

export const progressUpNextSchema = z.object({
  plan: planSummarySchema,
  day: z.object({
    id: apiIdSchema,
    dayNumber: z.number().int().min(1).max(7),
    title: z.string().min(1).max(300),
    estimatedMinutes: z.number().int().positive(),
    scheduledOn: isoDateSchema.nullable(),
  }),
  date: isoDateSchema,
});

export const progressResponseSchema = z.object({
  today: isoDateSchema,
  weekStart: isoDateSchema,
  week: z.array(progressDayActivitySchema).length(7),
  streak: streakSchema,
  totals: progressTotalsSchema,
  latestQuickCheck: latestQuickCheckScoreSchema.nullable(),
  upNext: progressUpNextSchema.nullable(),
});

export type ApiProgress = z.infer<typeof progressResponseSchema>;
