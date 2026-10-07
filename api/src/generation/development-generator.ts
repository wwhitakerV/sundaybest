import { generatedPlanSchema } from "./schema.js";
import type { PlanGenerationProvider } from "../providers/plan-generation-provider.js";

export function createDevelopmentGenerator(): PlanGenerationProvider {
  return {
    async generate(input) {
      const days = Array.from({ length: input.lengthDays }, (_, index) => {
        const dayNumber = index + 1;
        return {
          dayNumber,
          readingTitle: `Development Day ${dayNumber}`,
          readingParagraphs: [
            {
              heading: "Development Content",
              content: `Development-only generated content for “${input.sermon.title}”. Configure OPENAI_API_KEY before evaluating real study quality.`,
            },
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
          supportingScriptures: [],
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
                    variants: null,
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
        about: {
          overview: [`Development-only overview for “${input.sermon.title}”. Configure OPENAI_API_KEY before evaluating real study quality.`],
          keyTakeaways: ["This development plan exists only to exercise the data flow."],
          scripturesReferenced: [{ book: "Psalms", chapter: 119, verseStart: 105, verseEnd: 105, reference: "Psalm 119:105" }],
        },
        generator: { version: "dev-deterministic-1", promptVersion: null, provider: "development", model: null },
        days,
      });
    },
  };
}
