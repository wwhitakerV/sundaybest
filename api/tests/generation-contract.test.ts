import assert from "node:assert/strict";
import test from "node:test";

import { generatedPlanSchema } from "../src/providers/plan-generation-provider.js";

test("rejects quiz questions with multiple correct answers", () => {
  const result = generatedPlanSchema.safeParse({
    title: "Test",
    generator: { version: "1", promptVersion: null, provider: "test", model: null },
    days: [
      {
        dayNumber: 1,
        readingTitle: "Day 1",
        readingParagraphs: [{ heading: "Heading", content: "Text" }],
        sermonQuote: null,
        clipStartSeconds: null,
        clipEndSeconds: null,
        scripture: { book: "John", chapter: 1, verseStart: 1, verseEnd: 1, reference: "John 1:1" },
        reflections: ["Question?"],
        prayer: { title: "Prayer", text: "Amen." },
        quickCheck: {
          title: "Check",
          questions: [
            {
              kind: "multipleChoice",
              source: "scripture",
              prompt: "Question",
              scriptureReference: "John 1:1",
              explanation: null,
              choices: [
                { label: "A", text: "One", correct: true },
                { label: "B", text: "Two", correct: true },
              ],
            },
          ],
        },
      },
    ],
  });
  assert.equal(result.success, false);
});
