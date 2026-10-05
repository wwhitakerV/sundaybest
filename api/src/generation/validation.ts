import { AppError } from "../http/errors.js";
import type { BibleProvider } from "../providers/bible-provider.js";
import type { PlanGenerationInput } from "../providers/plan-generation-provider.js";
import { generatedPlanSchema, type GeneratedPlan } from "./schema.js";
import { canonicalizeScripture, referenceIsNamed } from "./scripture.js";
import { hasTranscriptTiming, normalizeSourceText, transcriptEndSeconds } from "./transcript.js";

function reject(message: string): never { throw new AppError("INTERNAL", message); }

export function validatePlanStructure(plan: GeneratedPlan, input: PlanGenerationInput): void {
  if (!generatedPlanSchema.safeParse(plan).success) reject("Generated content failed schema validation");
  if (plan.days.length !== input.lengthDays) reject("Generated plan has the wrong number of days");
  const segments = input.transcriptSegments;
  const source = normalizeSourceText(segments?.map((s) => s.text).join(" ") ?? input.transcript);
  const bound = segments ? transcriptEndSeconds(segments) : null;
  const reflections = new Set<string>();
  const questions = new Set<string>();
  const readings = new Set<string>();
  for (const day of plan.days) {
    const scripture = canonicalizeScripture(day.scripture);
    if (plan.generator.provider !== "development" && !referenceIsNamed(source, scripture)) reject(`Day ${day.dayNumber} uses Scripture not explicitly named in the transcript`);
    if (input.quickCheckEnabled !== (day.quickCheck !== null)) reject("Quick Check does not match the requested setting");
    if (day.sermonQuote && !source.includes(normalizeSourceText(day.sermonQuote))) reject("Sermon quote is not present in the transcript");
    if (day.clipStartSeconds !== null && day.clipEndSeconds !== null) {
      if (!segments || !hasTranscriptTiming(segments) || bound === null) reject("Cannot publish clips without source timing");
      if (day.clipEndSeconds > bound || day.clipStartSeconds >= bound) reject("Sermon clip exceeds transcript bounds");
      if (input.sermon.durationSeconds != null && day.clipEndSeconds > Math.ceil(input.sermon.durationSeconds)) reject("Sermon clip exceeds video duration");
      const excerpt = normalizeSourceText(segments.filter((s) => s.startMs < day.clipEndSeconds! * 1000 && (s.endMs ?? s.startMs + 1) > day.clipStartSeconds! * 1000).map((s) => s.text).join(" "));
      if (!excerpt || (day.sermonQuote && !excerpt.includes(normalizeSourceText(day.sermonQuote)))) reject("Clip does not contain its sermon quote");
    }
    const reading = normalizeSourceText(day.readingParagraphs.join(" "));
    if (readings.has(reading) && plan.generator.provider !== "development") reject("Generated days contain duplicate readings");
    readings.add(reading);
    for (const reflection of day.reflections) {
      const key = normalizeSourceText(reflection);
      if (reflections.has(key) && plan.generator.provider !== "development") reject("Duplicate reflection prompt");
      reflections.add(key);
    }
    for (const question of day.quickCheck?.questions ?? []) {
      if (question.kind === "finishTheVerse") reject("Translation-specific verse completion cannot be generated from a translation-neutral transcript");
      if (!question.explanation?.trim()) reject("Quick Check questions require teaching explanations");
      const key = normalizeSourceText(question.prompt);
      if (questions.has(key) && plan.generator.provider !== "development") reject("Duplicate Quick Check prompt");
      questions.add(key);
      const choiceTexts = new Set(question.choices.map((choice) => normalizeSourceText(choice.text)));
      const labels = new Set(question.choices.map((choice) => choice.label));
      if (choiceTexts.size !== question.choices.length || labels.size !== question.choices.length) reject("Quick Check choices must be distinct");
      if (question.source === "scripture" && question.scriptureReference !== scripture.reference) reject("Quick Check Scripture must match the day's passage");
      if (question.source === "sermon" && question.scriptureReference !== null) reject("Sermon questions must not claim a Scripture reference");
    }
  }
}

export async function validateGeneratedContent(plan: GeneratedPlan, input: PlanGenerationInput, bible: BibleProvider): Promise<void> {
  validatePlanStructure(plan, input);
  const references = new Map(plan.days.map((day) => [day.scripture.reference, day.scripture]));
  // KJV verifies reference existence only; the study service retains the user's translation.
  for (const [reference, scripture] of references) {
    const passage = await bible.getPassage({ reference, translation: "KJV" });
    const expected = Array.from({ length: scripture.verseEnd - scripture.verseStart + 1 }, (_, i) => scripture.verseStart + i);
    if (passage.verses.length !== expected.length || passage.verses.some((verse, index) => verse.number !== expected[index] || !verse.text.trim())) reject("Bible provider did not return the complete requested verse range");
  }
}
