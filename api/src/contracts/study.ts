import { z } from "zod";

import {
  apiIdSchema,
  bibleTranslationSchema,
  completedStudyStepsSchema,
  isoDateTimeSchema,
  studyStepSchema,
} from "./common.js";
import {
  dayReadingSchema,
  planDayProgressSchema,
  prayerContentSchema,
  reflectionPromptSchema,
  scriptureReferenceSchema,
} from "./plans.js";

export const scriptureVerseSchema = z.object({
  number: z.number().int().positive(),
  text: z.string().min(1),
});

export const translatedScriptureSchema = scriptureReferenceSchema.extend({
  translation: bibleTranslationSchema,
  verses: z.array(scriptureVerseSchema).min(1),
});

export const studyDaySchema = z.object({
  id: apiIdSchema,
  planId: apiIdSchema,
  dayNumber: z.number().int().min(1).max(7),
  reading: dayReadingSchema,
  scripture: translatedScriptureSchema,
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
