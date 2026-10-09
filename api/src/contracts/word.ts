import { z } from "zod";

import { apiIdSchema, isoDateTimeSchema } from "./common.js";

/**
 * A passage the reader has finished — once, however often it was studied:
 * where it sits in the Bible, its text in their translation (null if it
 * couldn't be had just now), and the study to open it again by, the latest.
 */
export const wordPassageSchema = z.object({
  reference: z.string().min(1).max(200),
  /** The book's canonical name: "Psalms", "1 Corinthians". */
  book: z.string().min(1).max(60),
  chapter: z.number().int().positive(),
  verseStart: z.number().int().positive(),
  text: z.string().min(1).max(20000).nullable(),
  planId: apiIdSchema,
  dayNumber: z.number().int().min(1).max(7),
  completedAt: isoDateTimeSchema,
});

/** The Word: every passage the reader has finished, and the translation its text is in. */
export const wordResponseSchema = z.object({
  translation: z.string().min(1).max(20),
  passages: z.array(wordPassageSchema),
});

export type ApiWord = z.infer<typeof wordResponseSchema>;
export type ApiWordPassage = z.infer<typeof wordPassageSchema>;
