import { z } from "zod";

import { apiIdSchema, isoDateTimeSchema } from "./common";

/** One question of a Quick Check as the reader was last asked it: whether they remembered, and the right answer. */
export const recalledQuestionSchema = z.object({
  id: apiIdSchema,
  prompt: z.string().min(1),
  answer: z.string(),
  /** What the reader chose, as they were shown it — null if it wasn't answered. */
  chosen: z.string().nullable(),
  correct: z.boolean(),
  /** Its answers are Scripture's own words (a verse to finish): shown in the Scripture face. */
  scripture: z.boolean(),
  /** The verse it's about, when it's about one. */
  reference: z.string().max(200).nullable(),
});

/** A Quick Check the reader has finished, as their latest finished attempt left it. */
export const recalledQuickCheckSchema = z.object({
  quizId: apiIdSchema,
  planId: apiIdSchema,
  planTitle: z.string().min(1).max(300),
  /** The plan's sermon's artwork, to know it by. */
  thumbnailUrl: z.url().nullable(),
  dayNumber: z.number().int().min(1).max(7),
  /** The day's passage. */
  reference: z.string().min(1).max(200),
  completedAt: isoDateTimeSchema,
  questions: z.array(recalledQuestionSchema),
});

/** Every Quick Check the reader has finished, newest first — their latest finished attempt at each. */
export const quickChecksResponseSchema = z.object({
  quickChecks: z.array(recalledQuickCheckSchema),
});

export type ApiQuickChecks = z.infer<typeof quickChecksResponseSchema>;
export type ApiRecalledQuickCheck = z.infer<typeof recalledQuickCheckSchema>;
