import { z } from "zod";

/** Shared transport primitives for the real SundayBest API. */
export const apiIdSchema = z.string().uuid();
export const isoDateTimeSchema = z.iso.datetime();
export const isoDateSchema = z.iso.date();
export const localTimeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const planLengthSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
]);
const weekdaySchema = z.enum(["sun", "mon", "tue", "wed", "thu", "fri", "sat"]);
export const weekdayListSchema = z
  .array(weekdaySchema)
  .min(1)
  .max(7)
  .refine((days) => new Set(days).size === days.length, "Weekdays must be unique");
export const bibleTranslationSchema = z.enum(["NIV", "ESV", "KJV", "NLT", "BSB"]);
export const themePreferenceSchema = z.enum(["system", "light", "dark"]);
export const textSizeSchema = z.enum(["small", "default", "large", "extraLarge"]);
export const readingPaperSchema = z.enum(["white", "ivory", "cream", "sepia", "dusk", "night"]);
export const readingTextOffsetSchema = z.union([
  z.literal(-4),
  z.literal(-2),
  z.literal(0),
  z.literal(2),
  z.literal(4),
  z.literal(6),
  z.literal(8),
]);
export const studyStepSchema = z.enum(["read", "scripture", "reflect", "pray"]);
const STUDY_STEP_ORDER = ["read", "scripture", "reflect", "pray"] as const;
export const completedStudyStepsSchema = z
  .array(studyStepSchema)
  .max(4)
  .superRefine((steps, ctx) => {
    if (new Set(steps).size !== steps.length) {
      ctx.addIssue({ code: "custom", message: "Completed study steps must be unique" });
    }

    const ordered = steps.every((step, index) => STUDY_STEP_ORDER[index] === step);
    if (!ordered) {
      ctx.addIssue({ code: "custom", message: "Completed study steps must be an ordered prefix" });
    }
  });

export const mutationAckSchema = z.object({ ok: z.literal(true) });
