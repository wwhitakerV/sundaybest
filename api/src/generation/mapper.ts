import { AppError } from "../http/errors.js";
import type { PlanGenerationInput } from "../providers/plan-generation-provider.js";
import { generationOutputSchema } from "./output-schema.js";
import { canonicalizeScripture, referenceIsNamed } from "./scripture.js";
import { generatedPlanSchema, type GeneratedPlan } from "./schema.js";
import { normalizeSourceText } from "./transcript.js";

export function mapGenerationOutput(raw: unknown, input: PlanGenerationInput, generator: GeneratedPlan["generator"]): GeneratedPlan {
  const parsed = generationOutputSchema.safeParse(raw);
  if (!parsed.success) throw new AppError("INTERNAL", "OpenAI returned invalid plan content");
  const source = normalizeSourceText(input.transcriptSegments?.map((s) => s.text).join(" ") ?? input.transcript);
  const days = parsed.data.days.map((day) => {
    const { evidenceQuote, ...fields } = day.scripture;
    const scripture = canonicalizeScripture(fields);
    if (!source.includes(normalizeSourceText(evidenceQuote)) || !referenceIsNamed(evidenceQuote, scripture)) {
      throw new AppError("INTERNAL", `Scripture evidence for day ${day.dayNumber} is not grounded in the transcript`);
    }
    const quickCheck = day.quickCheck && {
      title: day.quickCheck.title.trim(),
      questions: day.quickCheck.questions.map(({ evidenceQuote: questionEvidence, ...question }) => {
        if (question.source === "sermon" && (!questionEvidence || !source.includes(normalizeSourceText(questionEvidence)))) {
          throw new AppError("INTERNAL", "Quick Check answer evidence is not present in the transcript");
        }
        return { ...question, choices: question.choices.map((choice, index) => ({ ...choice, label: String.fromCharCode(65 + index) })) };
      }),
    };
    return { ...day, scripture, quickCheck };
  });
  const mapped = generatedPlanSchema.safeParse({ title: parsed.data.title, generator, days });
  if (!mapped.success) throw new AppError("INTERNAL", "Normalized generation failed domain validation");
  return mapped.data;
}
