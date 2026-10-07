import { z } from "zod";

import type { BibleTranslation as BundledTranslation } from "../../bible/types.js";
import { AppError } from "../../http/errors.js";
import type { PlanGenerationInput } from "../../providers/plan-generation-provider.js";
import { generatedQuestionSchema, type GeneratedQuestion } from "../schema.js";
import { canonicalizeScriptureFields } from "../scripture.js";
import { containsExcerpt, normalizeSourceText } from "../transcript.js";
import type { OutlineDay } from "./outline.js";

export const QUICK_CHECK_MIN = 7;
export const QUICK_CHECK_MAX = 10;
const CHOICES = 4;

const choice = z.object({ text: z.string().min(1).max(1000), correct: z.boolean() });
const verseAnswer = z.object({
  answer: z.string().min(1).max(200),
  distractors: z.array(z.string().min(1).max(200)).length(CHOICES - 1),
});

const question = z.object({
  kind: z.enum(["multipleChoice", "finishTheVerse"]),
  source: z.enum(["sermon", "scripture"]),
  prompt: z.string().min(1).max(2000).nullable(),
  explanation: z.string().min(1).max(3000),
  evidenceQuote: z.string().min(1).max(2000).nullable(),
  choices: z.array(choice).length(CHOICES).nullable(),
  verse: z.object({ number: z.number().int().min(1).max(176), BSB: verseAnswer, KJV: verseAnswer }).nullable(),
});

export const quizOutputSchema = z.object({
  title: z.string().min(1).max(200),
  // A follow-up call may need only a few more questions.
  questions: z.array(question).min(1).max(QUICK_CHECK_MAX),
});

export type QuizOutput = z.infer<typeof quizOutputSchema>;

/** A verified quiz step, as kept for a re-run. */
export const quizContentSchema = z.object({
  title: z.string().min(1),
  questions: z.array(generatedQuestionSchema).min(QUICK_CHECK_MIN).max(QUICK_CHECK_MAX),
});

export type QuizContent = z.infer<typeof quizContentSchema>;
export type QuizOutputQuestion = z.infer<typeof question>;

/** The day's passage in each bundled translation, as finish-the-verse is built from it. */
export type PassageText = Record<BundledTranslation, ReadonlyArray<{ number: number; text: string }>>;

export interface QuizContext {
  input: PlanGenerationInput;
  day: OutlineDay;
  passageText: PassageText;
}

/**
 * The quiz step. Each question is kept only if it can be verified: a sermon
 * question's evidence is in the transcript; a Scripture question is about the
 * day's passage; a finish-the-verse answer is in the verse's own wording in
 * every bundled translation. Every kept question teaches (an explanation),
 * offers four distinct choices with one right, and is not asked twice. New
 * questions follow any `kept` from an earlier call, up to ten; the pipeline
 * asks for more when fewer than seven are usable.
 */
export function mapQuiz(raw: unknown, context: QuizContext, kept: readonly GeneratedQuestion[] = []): { title: string; questions: GeneratedQuestion[] } {
  const parsed = quizOutputSchema.safeParse(raw);
  if (!parsed.success) throw new AppError("INTERNAL", `The quiz step returned invalid content for day ${context.day.dayNumber}`);
  const source = normalizeSourceText(context.input.transcriptSegments?.map((s) => s.text).join(" ") ?? context.input.transcript);
  const prompts = new Set(kept.map((question) => normalizeSourceText(question.prompt)));
  const questions = [...kept];
  for (const output of parsed.data.questions) {
    if (questions.length === QUICK_CHECK_MAX) break;
    const built = output.kind === "finishTheVerse"
      ? finishTheVerse(output, context, questions.length % CHOICES)
      : multipleChoice(output, context.day, source);
    if (!built) continue;
    const key = normalizeSourceText(built.prompt);
    if (prompts.has(key)) continue;
    prompts.add(key);
    questions.push(built);
  }
  return { title: parsed.data.title.trim(), questions: mixQuestionKinds(questions) };
}

/**
 * The quiz's questions with its two kinds spread evenly through it — never
 * every multiple choice and then every finish-the-verse — each kind keeping
 * its own order. The reader answers in this order (the stored position).
 */
export function mixQuestionKinds<Question extends { kind: GeneratedQuestion["kind"] }>(questions: readonly Question[]): Question[] {
  const choices = questions.filter((question) => question.kind === "multipleChoice");
  const verses = questions.filter((question) => question.kind === "finishTheVerse");
  const mixed: Question[] = [];
  let c = 0;
  let v = 0;
  while (c < choices.length || v < verses.length) {
    // Take from whichever kind is further behind its share of the quiz.
    const takeChoice = v === verses.length || (c < choices.length && c / choices.length <= v / verses.length);
    mixed.push(takeChoice ? choices[c++]! : verses[v++]!);
  }
  return mixed;
}

function multipleChoice(output: QuizOutputQuestion, day: OutlineDay, source: string): GeneratedQuestion | null {
  const explanation = output.explanation.trim();
  if (!output.prompt || !output.choices || !explanation) return null;
  if (output.choices.filter((option) => option.correct).length !== 1) return null;
  if (!distinct(output.choices.map((option) => option.text))) return null;
  if (output.source === "sermon" && (!output.evidenceQuote || !containsExcerpt(source, output.evidenceQuote))) return null;
  return {
    kind: "multipleChoice",
    source: output.source,
    prompt: output.prompt.trim(),
    scriptureReference: output.source === "scripture" ? day.scripture.reference : null,
    explanation,
    choices: output.choices.map((option, index) => ({ label: label(index), text: option.text.trim(), correct: option.correct })),
    variants: null,
  };
}

/**
 * Builds finish-the-verse from the bundled text, never the model's memory: the
 * model picks a verse and the phrase to blank in each translation; the server
 * finds that phrase in the real verse and blanks it. The answer sits in the
 * same position in every translation, so one answer key serves them all.
 */
function finishTheVerse(output: QuizOutputQuestion, context: QuizContext, correctIndex: number): GeneratedQuestion | null {
  const { verse } = output;
  const { scripture } = context.day;
  const explanation = output.explanation.trim();
  if (!verse || !explanation || verse.number < scripture.verseStart || verse.number > scripture.verseEnd) return null;
  const variants: Partial<NonNullable<GeneratedQuestion["variants"]>> = {};
  for (const translation of ["BSB", "KJV"] as const) {
    const text = context.passageText[translation].find((candidate) => candidate.number === verse.number)?.text;
    const { answer, distractors } = verse[translation];
    const phrase = trimPunctuation(answer);
    const at = text ? findPhrase(text, phrase) : -1;
    if (!text || at === -1) return null;
    const options = distractors.map((distractor) => trimPunctuation(distractor));
    options.splice(correctIndex, 0, text.slice(at, at + phrase.length));
    if (!distinct(options)) return null;
    variants[translation] = { prompt: `Finish the verse: “${text.slice(0, at)}___${text.slice(at + phrase.length)}”`, choices: options };
  }
  const { BSB, KJV } = variants;
  if (!BSB || !KJV) return null;
  return {
    kind: "finishTheVerse",
    source: "scripture",
    prompt: BSB.prompt,
    scriptureReference: canonicalizeScriptureFields({ ...scripture, verseStart: verse.number, verseEnd: verse.number }).reference,
    explanation,
    choices: BSB.choices.map((text, index) => ({ label: label(index), text, correct: index === correctIndex })),
    variants: { BSB, KJV },
  };
}

/** Where a whole-word phrase starts in a verse, ignoring case; -1 when it is not there. */
function findPhrase(text: string, phrase: string): number {
  if (!phrase) return -1;
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  const match = new RegExp(`(^|[^\\p{L}\\p{N}])(${escaped})(?=$|[^\\p{L}\\p{N}])`, "iu").exec(text);
  return match ? match.index + match[1]!.length : -1;
}

function trimPunctuation(value: string): string {
  return value.replace(/^[\p{P}\s]+|[\p{P}\s]+$/gu, "");
}

function distinct(texts: readonly string[]): boolean {
  return new Set(texts.map((text) => normalizeSourceText(text))).size === texts.length;
}

function label(index: number): string {
  return String.fromCharCode(65 + index);
}
