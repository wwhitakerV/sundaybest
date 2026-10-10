import { z } from "zod";

import { apiIdSchema } from "./common";

/**
 * A reflection question from one of the reader's plans: what was asked, the
 * passage it came from, and the study it's in. What the reader wrote to it
 * never reaches the server — it lives on their phone, under this id.
 */
export const myReflectionPromptSchema = z.object({
  id: apiIdSchema,
  question: z.string().min(1).max(2000),
  reference: z.string().min(1).max(200),
  planId: apiIdSchema,
  /** The plan it's in, by title: the list of every reflection groups by it. */
  planTitle: z.string().min(1).max(300),
  /** The plan's sermon's artwork, to know it by. */
  thumbnailUrl: z.url().nullable(),
  dayNumber: z.number().int().min(1).max(7),
});

/** Every reflection question in the reader's plans, for their phone to match with what they wrote. */
export const reflectionsResponseSchema = z.object({
  prompts: z.array(myReflectionPromptSchema),
});

export type ApiReflections = z.infer<typeof reflectionsResponseSchema>;
export type ApiMyReflectionPrompt = z.infer<typeof myReflectionPromptSchema>;
