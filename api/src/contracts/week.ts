import { z } from "zod";

import { apiIdSchema, isoDateSchema } from "./common.js";

/**
 * One plan's passage on a date of the week. `done`: finished (on any date).
 * `open`: its day has come and it can be read. `waiting`: its day has come,
 * but the plan's day before it isn't finished yet. `upcoming`: its date is
 * still ahead.
 */
export const weekPassageSchema = z.object({
  planId: apiIdSchema,
  planTitle: z.string().min(1).max(300),
  dayNumber: z.number().int().min(1).max(7),
  reference: z.string().min(1).max(200),
  status: z.enum(["done", "open", "waiting", "upcoming"]),
  /** One verse from the passage, short enough to read whole, in the reader's translation — once it's done. */
  keyVerse: z.object({ number: z.number().int().positive(), text: z.string().min(1) }).nullable(),
  /** Its reflection questions' ids, in order: the reader's answers live on their phone under them. */
  reflectionIds: z.array(apiIdSchema),
});

/**
 * A date of the week. `studied`: at least one passage was finished on it.
 * `today`: today, nothing finished yet. `notStudied`: a past day with nothing
 * finished on it. `upcoming`: still ahead.
 */
export const weekDaySchema = z.object({
  date: isoDateSchema,
  state: z.enum(["studied", "today", "notStudied", "upcoming"]),
  /** Its passages, one per plan scheduled on it, the newest sermon first. */
  passages: z.array(weekPassageSchema),
});

export const weekResponseSchema = z.object({
  today: isoDateSchema,
  weekStart: isoDateSchema,
  /** The reader's Bible translation, which the key verses are in: "BSB". */
  translation: z.string().min(1).max(20),
  /**
   * Every week a plan ran in, up to this one, newest first: its Sunday, how
   * many plans it held, and its newest plan's title. The weeks the reader can
   * go to.
   */
  weeks: z.array(
    z.object({
      weekStart: isoDateSchema,
      planCount: z.number().int().positive(),
      title: z.string().min(1).max(300),
    }),
  ),
  /** The plans with a passage this week: how many, and — when it's one — its title and church. */
  header: z.object({
    planCount: z.number().int().nonnegative(),
    title: z.string().min(1).max(300).nullable(),
    church: z.string().max(200).nullable(),
  }),
  days: z.array(weekDaySchema).length(7),
  /** All-time, for the rows under the week. */
  summary: z.object({
    passageCount: z.number().int().nonnegative(),
    bookCount: z.number().int().nonnegative(),
    /** Quick Check answers right, and missed, from each Quick Check's latest attempt. */
    right: z.number().int().nonnegative(),
    missed: z.number().int().nonnegative(),
  }),
});

export type ApiWeek = z.infer<typeof weekResponseSchema>;
export type ApiWeekDay = z.infer<typeof weekDaySchema>;
export type ApiWeekPassage = z.infer<typeof weekPassageSchema>;
