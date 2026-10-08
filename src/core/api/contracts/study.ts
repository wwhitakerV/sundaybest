import { z } from "zod";

import {
  apiIdSchema,
  bibleTranslationSchema,
  completedStudyStepsSchema,
  isoDateTimeSchema,
  studyStepSchema,
} from "./common";
import {
  dayReadingSchema,
  planDayProgressSchema,
  prayerContentSchema,
  reflectionPromptSchema,
  scriptureReferenceSchema,
} from "./plans";

const scriptureVerseSchema = z.object({
  number: z.number().int().positive(),
  text: z.string().min(1),
});

const translatedScriptureSchema = scriptureReferenceSchema.extend({
  translation: bibleTranslationSchema,
  verses: z.array(scriptureVerseSchema).min(1),
  /** Whether the licensed provider permits durable on-device caching. */
  cacheAllowed: z.boolean(),
});

/**
 * Scripture SundayBest chose to support the day's teaching ("Dive deeper"). The
 * sermon did not cite it; `connection` says how it ties to the reading.
 */
const supportingScriptureSchema = translatedScriptureSchema
  .omit({ id: true, cacheAllowed: true })
  .extend({ connection: z.string().min(1).max(600) });

export const studyDaySchema = z.object({
  id: apiIdSchema,
  planId: apiIdSchema,
  dayNumber: z.number().int().min(1).max(7),
  reading: dayReadingSchema,
  scripture: translatedScriptureSchema,
  // Defaulted so study days cached on a device before this field existed still parse.
  supportingScriptures: z.array(supportingScriptureSchema).default([]),
  reflectionPrompts: z.array(reflectionPromptSchema),
  prayer: prayerContentSchema,
  quickCheckId: apiIdSchema.nullable(),
  progress: planDayProgressSchema,
});

export const getStudyDayResponseSchema = z.object({ day: studyDaySchema });

export const completeStudyStepRequestSchema = z
  .object({
    step: studyStepSchema,
  })
  .strict();

export const completeStudyStepResponseSchema = z.object({
  completedSteps: completedStudyStepsSchema,
  updatedAt: isoDateTimeSchema,
});

export const completeStudyDayResponseSchema = z.object({
  completedAt: isoDateTimeSchema,
  planCompletedAt: isoDateTimeSchema.nullable(),
});

export type ApiStudyDay = z.infer<typeof studyDaySchema>;
