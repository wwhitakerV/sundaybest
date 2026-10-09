import { z } from "zod";

import { apiIdSchema, isoDateSchema } from "./common.js";

/** One plan in a week, with everything that helps the reader place it. */
export const weekHistoryPlanSchema = z.object({
  planId: apiIdSchema,
  title: z.string().min(1).max(300),
  church: z.string().max(200).nullable(),
  thumbnailUrl: z.url().nullable(),
  thumbnailColors: z.array(z.string().regex(/^#[0-9a-f]{6}$/i)).max(6),
  /** The passages scheduled for it that week, in order, and whether each was read. */
  passages: z.array(z.object({ reference: z.string().min(1).max(200), done: z.boolean() })),
  /** The reflection questions of its days read that week: answers live on the reader's phone under them. */
  reflectionIds: z.array(apiIdSchema),
});

/** A week a plan ran in: its Sunday, how many of its days had study in them, and its plans, newest sermon first. */
export const weekHistoryEntrySchema = z.object({
  weekStart: isoDateSchema,
  daysStudied: z.number().int().min(0).max(7),
  plans: z.array(weekHistoryPlanSchema).min(1),
});

/** Every week a plan ran in, up to this one, newest first — for finding a week again. */
export const weeksResponseSchema = z.object({
  currentWeekStart: isoDateSchema,
  weeks: z.array(weekHistoryEntrySchema),
});

export type ApiWeeks = z.infer<typeof weeksResponseSchema>;
export type ApiWeekHistory = z.infer<typeof weekHistoryEntrySchema>;
export type ApiWeekHistoryPlan = z.infer<typeof weekHistoryPlanSchema>;
