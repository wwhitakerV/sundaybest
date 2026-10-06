import { z } from "zod";

const generatedChoiceSchema = z.object({
  label: z.string().trim().min(1).max(4),
  text: z.string().trim().min(1).max(1000),
  correct: z.boolean(),
});

/**
 * One translation's wording of a finish-the-verse question. Choices are in the
 * same order as the question's `choices`, so the answer key is shared.
 */
const verseVariantSchema = z.object({
  prompt: z.string().trim().min(1).max(2000),
  choices: z.array(z.string().trim().min(1).max(1000)).length(4),
});

export const questionVariantsSchema = z.object({ BSB: verseVariantSchema, KJV: verseVariantSchema });

export const generatedQuestionSchema = z
  .object({
    kind: z.enum(["multipleChoice", "finishTheVerse"]),
    source: z.enum(["sermon", "scripture"]),
    prompt: z.string().trim().min(1).max(2000),
    scriptureReference: z.string().trim().min(1).max(100).nullable(),
    explanation: z.string().trim().min(1).max(3000).nullable(),
    choices: z.array(generatedChoiceSchema).min(2).max(8),
    /** Finish the verse in each bundled translation; null for every other question. */
    variants: questionVariantsSchema.nullable(),
  })
  .superRefine((question, ctx) => {
    if (question.choices.filter((choice) => choice.correct).length !== 1) {
      ctx.addIssue({ code: "custom", message: "Every quiz question must have exactly one correct choice" });
    }
  });

export const generatedScriptureSchema = z
  .object({
    book: z.string().trim().min(1).max(80),
    chapter: z.number().int().min(1).max(150),
    verseStart: z.number().int().min(1).max(176),
    verseEnd: z.number().int().min(1).max(176),
    reference: z.string().trim().min(1).max(100),
  })
  .superRefine((scripture, ctx) => {
    if (scripture.verseEnd < scripture.verseStart) {
      ctx.addIssue({ code: "custom", path: ["verseEnd"], message: "verseEnd must be >= verseStart" });
    }
  });

/**
 * A passage SundayBest chose to support a day's teaching — never one the sermon
 * named — with how it ties in. Kept apart from the sermon's own Scripture.
 */
export const generatedSupportingScriptureSchema = generatedScriptureSchema.safeExtend({
  connection: z.string().trim().min(1).max(600),
});

export const generatedDaySchema = z
  .object({
    dayNumber: z.number().int().min(1).max(7),
    readingTitle: z.string().trim().min(1).max(300),
    /** The day's thesis from the plan step; never shown. Kept so quizzes can be added to a reused plan. */
    focus: z.string().trim().min(1).max(600).nullable().default(null),
    readingParagraphs: z.array(z.string().trim().min(1).max(8000)).min(1).max(20),
    sermonQuote: z.string().trim().min(1).max(2000).nullable(),
    clipStartSeconds: z.number().int().nonnegative().nullable(),
    clipEndSeconds: z.number().int().nonnegative().nullable(),
    scripture: generatedScriptureSchema,
    reflections: z.array(z.string().trim().min(1).max(1000)).min(1).max(5),
    prayer: z.object({ title: z.string().trim().min(1).max(200), text: z.string().trim().min(1).max(5000) }),
    supportingScriptures: z.array(generatedSupportingScriptureSchema).max(3),
    quickCheck: z
      .object({ title: z.string().trim().min(1).max(200), questions: z.array(generatedQuestionSchema).min(1).max(10) })
      .nullable(),
  })
  .superRefine((day, ctx) => {
    if (day.clipStartSeconds !== null && day.clipEndSeconds !== null && day.clipEndSeconds <= day.clipStartSeconds) {
      ctx.addIssue({ code: "custom", path: ["clipEndSeconds"], message: "clip end must be > clip start" });
    }
    if ((day.clipStartSeconds === null) !== (day.clipEndSeconds === null)) {
      ctx.addIssue({ code: "custom", path: ["clipStartSeconds"], message: "clip timestamps must be both present or both absent" });
    }
  });

/** A Scripture the sermon names: a verse range, or a whole chapter when both verses are null. */
export const generatedCitationSchema = z
  .object({
    book: z.string().trim().min(1).max(80),
    chapter: z.number().int().min(1).max(150),
    verseStart: z.number().int().min(1).max(176).nullable(),
    verseEnd: z.number().int().min(1).max(176).nullable(),
    reference: z.string().trim().min(1).max(100),
  })
  .superRefine((citation, ctx) => {
    if ((citation.verseStart === null) !== (citation.verseEnd === null)) {
      ctx.addIssue({ code: "custom", path: ["verseStart"], message: "verse bounds must be both present or both absent" });
    }
    if (citation.verseStart !== null && citation.verseEnd !== null && citation.verseEnd < citation.verseStart) {
      ctx.addIssue({ code: "custom", path: ["verseEnd"], message: "verseEnd must be >= verseStart" });
    }
  });

/** Plan Overview's About This Plan section. */
export const generatedAboutSchema = z.object({
  overview: z.array(z.string().trim().min(1).max(3000)).min(1).max(5),
  keyTakeaways: z.array(z.string().trim().min(1).max(500)).min(1).max(7),
  scripturesReferenced: z.array(generatedCitationSchema).max(30),
});

export const generatedPlanSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    about: generatedAboutSchema,
    generator: z.object({
      version: z.string().trim().min(1).max(100),
      promptVersion: z.string().trim().min(1).max(100).nullable(),
      provider: z.string().trim().min(1).max(100),
      model: z.string().trim().min(1).max(200).nullable(),
    }),
    days: z.array(generatedDaySchema).min(1).max(7),
  })
  .superRefine((plan, ctx) => {
    const ordered = plan.days.every((day, index) => day.dayNumber === index + 1);
    if (!ordered) ctx.addIssue({ code: "custom", message: "Generated days must be contiguous and ordered from 1" });
  });

export type GeneratedPlan = z.infer<typeof generatedPlanSchema>;
export type GeneratedCitation = z.infer<typeof generatedCitationSchema>;
export type GeneratedSupportingScripture = z.infer<typeof generatedSupportingScriptureSchema>;
export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type GeneratedAbout = z.infer<typeof generatedAboutSchema>;
