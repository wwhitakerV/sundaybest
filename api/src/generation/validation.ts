import { AppError } from "../http/errors.js";
import type { BibleProvider } from "../providers/bible-provider.js";
import type { PlanGenerationInput } from "../providers/plan-generation-provider.js";
import { generatedPlanSchema, type GeneratedPlan } from "./schema.js";
import { canonicalizeCitation, canonicalizeScripture, chapterIsNamed, referenceIsNamed, type ScriptureRange } from "./scripture.js";
import { assertPassageReads, readsInEveryBundledTranslation } from "./scripture-text.js";
import { clipIsValid } from "./clip.js";
import { containsExcerpt, normalizeSourceText } from "./transcript.js";

const QUICK_CHECK_MIN = 7;
const QUICK_CHECK_MAX = 10;
const QUICK_CHECK_CHOICES = 4;

function reject(message: string): never { throw new AppError("INTERNAL", message); }

export function validatePlanStructure(plan: GeneratedPlan, input: PlanGenerationInput): void {
  if (!generatedPlanSchema.safeParse(plan).success) reject("Generated content failed schema validation");
  if (plan.days.length !== input.lengthDays) reject("Generated plan has the wrong number of days");
  // The development fixture exercises data flow only; it is never real study content.
  const real = plan.generator.provider !== "development";
  const segments = input.transcriptSegments;
  const source = normalizeSourceText(segments?.map((s) => s.text).join(" ") ?? input.transcript);
  for (const citation of plan.about.scripturesReferenced) {
    if (real && !referenceIsNamed(source, canonicalizeCitation(citation))) reject(`Scriptures referenced: ${citation.reference} is not named in the transcript`);
  }
  plan.days.forEach((day, index) => {
    const earlier = plan.days.slice(0, index).find((other) => other.scripture.book === day.scripture.book && other.scripture.chapter === day.scripture.chapter
      && other.scripture.verseStart <= day.scripture.verseEnd && day.scripture.verseStart <= other.scripture.verseEnd);
    if (earlier) reject(`Days ${earlier.dayNumber} and ${day.dayNumber} study overlapping passages`);
  });
  for (const day of plan.days) {
    const listed = plan.about.scripturesReferenced.some((citation) => citation.chapter === day.scripture.chapter && canonicalizeCitation(citation).book === canonicalizeScripture(day.scripture).book);
    if (!listed) reject(`Scriptures referenced must include day ${day.dayNumber}'s passage`);
  }
  const reflections = new Set<string>();
  const questions = new Set<string>();
  const readings = new Set<string>();
  for (const day of plan.days) {
    const scripture = canonicalizeScripture(day.scripture);
    if (real && !chapterIsNamed(source, scripture)) reject(`Day ${day.dayNumber} uses Scripture not explicitly named in the transcript`);
    if (input.quickCheckEnabled !== (day.quickCheck !== null)) reject("Quick Check does not match the requested setting");
    if (day.sermonQuote && !containsExcerpt(source, day.sermonQuote)) reject("Sermon quote is not present in the transcript");
    if (day.clipStartSeconds !== null && day.clipEndSeconds !== null && !clipIsValid(day.clipStartSeconds, day.clipEndSeconds, day.sermonQuote, input)) {
      reject("Sermon clip lacks source timing, exceeds the transcript or video, or does not contain its quote");
    }
    const reading = normalizeSourceText(day.readingParagraphs.join(" "));
    if (readings.has(reading) && plan.generator.provider !== "development") reject("Generated days contain duplicate readings");
    readings.add(reading);
    for (const reflection of day.reflections) {
      const key = normalizeSourceText(reflection);
      if (reflections.has(key) && plan.generator.provider !== "development") reject("Duplicate reflection prompt");
      reflections.add(key);
    }
    const questionCount = day.quickCheck?.questions.length ?? QUICK_CHECK_MIN;
    if (real && (questionCount < QUICK_CHECK_MIN || questionCount > QUICK_CHECK_MAX)) reject("Quick Checks need seven to ten questions");
    for (const question of day.quickCheck?.questions ?? []) {
      if (real && question.choices.length !== QUICK_CHECK_CHOICES) reject("Quick Check questions need four choices");
      if (question.kind === "finishTheVerse") {
        if (!question.variants) reject("Finish the verse needs both translations");
        if (!question.scriptureReference || !versesOf(scripture).includes(question.scriptureReference)) reject("Finish the verse must be in the day's passage");
      }
      if (!question.explanation?.trim()) reject("Quick Check questions require teaching explanations");
      const key = normalizeSourceText(question.prompt);
      if (questions.has(key) && plan.generator.provider !== "development") reject("Duplicate Quick Check prompt");
      questions.add(key);
      const choiceTexts = new Set(question.choices.map((choice) => normalizeSourceText(choice.text)));
      const labels = new Set(question.choices.map((choice) => choice.label));
      if (choiceTexts.size !== question.choices.length || labels.size !== question.choices.length) reject("Quick Check choices must be distinct");
      if (question.kind === "multipleChoice" && question.source === "scripture" && question.scriptureReference !== scripture.reference) reject("Quick Check Scripture must match the day's passage");
      if (question.source === "sermon" && question.scriptureReference !== null) reject("Sermon questions must not claim a Scripture reference");
    }
  }
}

/**
 * Checks every passage against the Bible text and returns the plan to publish:
 * supporting Scripture without text in every bundled translation is left out.
 */
/**
 * Checks every passage against the Bible text and returns the plan to publish:
 * supporting Scripture without text in every bundled translation is left out.
 */
export async function validateGeneratedContent(plan: GeneratedPlan, input: PlanGenerationInput, bible: BibleProvider): Promise<GeneratedPlan> {
  validatePlanStructure(plan, input);
  const passages = new Map(plan.days.map((day) => [day.scripture.reference, day.scripture]));
  for (const scripture of passages.values()) await assertPassageReads(scripture, bible);
  const days = [];
  for (const day of plan.days) {
    const supportingScriptures = [];
    for (const passage of day.supportingScriptures) {
      if (await readsInEveryBundledTranslation(passage.reference, bible)) supportingScriptures.push(passage);
    }
    days.push({ ...day, supportingScriptures });
  }
  return { ...plan, days };
}

/** Each single-verse reference in a passage: "John 3:16-17" gives "John 3:16" and "John 3:17". */
function versesOf(scripture: ScriptureRange): string[] {
  const book = scripture.reference.replace(/ \d+:.*$/, "");
  return Array.from({ length: scripture.verseEnd - scripture.verseStart + 1 }, (_, i) => `${book} ${scripture.chapter}:${scripture.verseStart + i}`);
}
