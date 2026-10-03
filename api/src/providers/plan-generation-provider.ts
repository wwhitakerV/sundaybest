import { z } from "zod";

import type { Env } from "../config/env.js";
import { AppError } from "../http/errors.js";
import { postJson } from "./http.js";

const generatedChoiceSchema = z.object({
  label: z.string().min(1).max(4),
  text: z.string().min(1).max(1000),
  correct: z.boolean(),
});

const generatedQuestionSchema = z
  .object({
    kind: z.enum(["multipleChoice", "finishTheVerse"]),
    source: z.enum(["sermon", "scripture"]),
    prompt: z.string().min(1).max(2000),
    scriptureReference: z.string().max(100).nullable(),
    explanation: z.string().max(3000).nullable(),
    choices: z.array(generatedChoiceSchema).min(2).max(8),
  })
  .superRefine((question, ctx) => {
    if (question.choices.filter((choice) => choice.correct).length !== 1) {
      ctx.addIssue({ code: "custom", message: "Every quiz question must have exactly one correct choice" });
    }
  });

const generatedScriptureSchema = z
  .object({
    book: z.string().min(1).max(80),
    chapter: z.number().int().positive(),
    verseStart: z.number().int().positive(),
    verseEnd: z.number().int().positive(),
    reference: z.string().min(1).max(100),
  })
  .superRefine((scripture, ctx) => {
    if (scripture.verseEnd < scripture.verseStart) {
      ctx.addIssue({ code: "custom", path: ["verseEnd"], message: "verseEnd must be >= verseStart" });
    }
  });

const generatedDaySchema = z
  .object({
    dayNumber: z.number().int().min(1).max(7),
    readingTitle: z.string().min(1).max(300),
    readingParagraphs: z.array(z.string().min(1)).min(1).max(12),
    sermonQuote: z.string().max(2000).nullable(),
    clipStartSeconds: z.number().int().nonnegative().nullable(),
    clipEndSeconds: z.number().int().nonnegative().nullable(),
    scripture: generatedScriptureSchema,
    reflections: z.array(z.string().min(1).max(1000)).min(1).max(5),
    prayer: z.object({ title: z.string().min(1).max(200), text: z.string().min(1).max(5000) }),
    quickCheck: z
      .object({ title: z.string().min(1).max(200), questions: z.array(generatedQuestionSchema).min(1).max(10) })
      .nullable(),
  })
  .superRefine((day, ctx) => {
    if (day.clipStartSeconds !== null && day.clipEndSeconds !== null && day.clipEndSeconds < day.clipStartSeconds) {
      ctx.addIssue({ code: "custom", path: ["clipEndSeconds"], message: "clip end must be >= clip start" });
    }
    if ((day.clipStartSeconds === null) !== (day.clipEndSeconds === null)) {
      ctx.addIssue({ code: "custom", path: ["clipStartSeconds"], message: "clip timestamps must be both present or both absent" });
    }
  });

export const generatedPlanSchema = z
  .object({
    title: z.string().min(1).max(300),
    generator: z.object({
      version: z.string().min(1).max(100),
      promptVersion: z.string().min(1).max(100).nullable(),
      provider: z.string().min(1).max(100),
      model: z.string().min(1).max(200).nullable(),
    }),
    days: z.array(generatedDaySchema).min(1).max(7),
  })
  .superRefine((plan, ctx) => {
    const ordered = plan.days.every((day, index) => day.dayNumber === index + 1);
    if (!ordered) ctx.addIssue({ code: "custom", message: "Generated days must be contiguous and ordered from 1" });
  });

export type GeneratedPlan = z.infer<typeof generatedPlanSchema>;

export interface PlanGenerationProvider {
  generate(input: {
    sermon: { externalId: string; canonicalUrl: string; title: string; church: string | null };
    transcript: string;
    lengthDays: number;
    quickCheckEnabled: boolean;
  }): Promise<GeneratedPlan>;
}

export function createPlanGenerationProvider(env: Env): PlanGenerationProvider {
  if (!env.PLAN_GENERATION_PROVIDER_URL) {
    if (env.NODE_ENV === "production") {
      return { async generate() { throw new AppError("INTERNAL", "Plan-generation provider is not configured"); } };
    }
    return createDevelopmentGenerator();
  }

  return {
    async generate(input) {
      const raw = await postJson({
        url: env.PLAN_GENERATION_PROVIDER_URL!,
        token: env.PLAN_GENERATION_PROVIDER_TOKEN,
        body: input,
        timeoutMs: 120_000,
      });
      const parsed = generatedPlanSchema.safeParse(raw);
      if (!parsed.success) throw new AppError("INTERNAL", "Plan-generation provider returned invalid content");
      if (parsed.data.days.length !== input.lengthDays) {
        throw new AppError("INTERNAL", "Plan-generation provider returned the wrong number of days");
      }
      if (!input.quickCheckEnabled && parsed.data.days.some((day) => day.quickCheck !== null)) {
        throw new AppError("INTERNAL", "Provider returned Quick Check content when it was disabled");
      }
      if (input.quickCheckEnabled && parsed.data.days.some((day) => day.quickCheck === null)) {
        throw new AppError("INTERNAL", "Provider omitted required Quick Check content");
      }
      return parsed.data;
    },
  };
}

function createDevelopmentGenerator(): PlanGenerationProvider {
  return {
    async generate(input) {
      const days = Array.from({ length: input.lengthDays }, (_, index) => {
        const dayNumber = index + 1;
        return {
          dayNumber,
          readingTitle: `Development Day ${dayNumber}`,
          readingParagraphs: [
            `Development-only generated content for “${input.sermon.title}”. Configure PLAN_GENERATION_PROVIDER_URL before evaluating real study quality.`,
          ],
          sermonQuote: null,
          clipStartSeconds: null,
          clipEndSeconds: null,
          scripture: {
            book: "Psalms",
            chapter: 119,
            verseStart: 105,
            verseEnd: 105,
            reference: "Psalm 119:105",
          },
          reflections: ["What is one concrete truth from today's study you need to carry into your day?"],
          prayer: {
            title: "Prayer",
            text: "Lord, help me respond faithfully to Your Word today. Amen.",
          },
          quickCheck: input.quickCheckEnabled
            ? {
                title: `Day ${dayNumber} Quick Check`,
                questions: [
                  {
                    kind: "multipleChoice" as const,
                    source: "scripture" as const,
                    prompt: "Which passage is attached to this development study day?",
                    scriptureReference: "Psalm 119:105",
                    explanation: "This development question exists only to exercise the quiz data flow.",
                    choices: [
                      { label: "A", text: "Psalm 119:105", correct: true },
                      { label: "B", text: "Genesis 1:1", correct: false },
                    ],
                  },
                ],
              }
            : null,
        };
      });

      return generatedPlanSchema.parse({
        title: input.sermon.title,
        generator: { version: "dev-deterministic-1", promptVersion: null, provider: "development", model: null },
        days,
      });
    },
  };
}
