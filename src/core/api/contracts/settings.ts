import { z } from "zod";

import {
  apiIdSchema,
  bibleTranslationSchema,
  isoDateTimeSchema,
  localTimeSchema,
  planLengthSchema,
  readingPaperSchema,
  readingTextOffsetSchema,
  textSizeSchema,
  themePreferenceSchema,
  weekdayListSchema,
} from "./common";

export const userSettingsSchema = z.object({
  userId: apiIdSchema,
  theme: themePreferenceSchema,
  textSize: textSizeSchema,
  bibleTranslation: bibleTranslationSchema,
  defaultPlanLength: planLengthSchema,
  quickCheckByDefault: z.boolean(),
  hapticsEnabled: z.boolean(),
  readingTextOffset: readingTextOffsetSchema,
  readingPaper: readingPaperSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const getSettingsResponseSchema = z.object({ settings: userSettingsSchema });

export const updateSettingsRequestSchema = z
  .object({
    theme: themePreferenceSchema.optional(),
    textSize: textSizeSchema.optional(),
    bibleTranslation: bibleTranslationSchema.optional(),
    defaultPlanLength: planLengthSchema.optional(),
    quickCheckByDefault: z.boolean().optional(),
    hapticsEnabled: z.boolean().optional(),
    readingTextOffset: readingTextOffsetSchema.optional(),
    readingPaper: readingPaperSchema.optional(),
  })
  .strict();

export const reminderKindSchema = z.enum(["dailyStudy", "quickCheck"]);

export const reminderSchema = z.object({
  id: apiIdSchema,
  userId: apiIdSchema,
  kind: reminderKindSchema,
  planId: apiIdSchema.nullable(),
  enabled: z.boolean(),
  time: localTimeSchema,
  days: weekdayListSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const getRemindersResponseSchema = z.object({ reminders: z.array(reminderSchema) });
export const updateReminderResponseSchema = z.object({ reminder: reminderSchema });

export const updateReminderRequestSchema = z
  .object({
    enabled: z.boolean().optional(),
    time: localTimeSchema.optional(),
    days: weekdayListSchema.optional(),
  })
  .strict();

export type ApiUserSettings = z.infer<typeof userSettingsSchema>;
export type UpdateSettingsRequest = z.infer<typeof updateSettingsRequestSchema>;
export type ApiReminder = z.infer<typeof reminderSchema>;
export type ReminderKind = z.infer<typeof reminderKindSchema>;
export type UpdateReminderRequest = z.infer<typeof updateReminderRequestSchema>;
