import { createHash } from "node:crypto";

import { AppError } from "../http/errors.js";
import type { BibleProvider } from "../providers/bible-provider.js";
import type { PlanGenerationInput } from "../providers/plan-generation-provider.js";
import { sourceContext } from "./prompts/context.js";
import { DAY_INSTRUCTIONS, dayTask } from "./prompts/day.js";
import { OUTLINE_INSTRUCTIONS, outlineTask } from "./prompts/outline.js";
import { QUIZ_INSTRUCTIONS, quizTask } from "./prompts/quiz.js";
import { GENERATOR_VERSION, PROMPT_VERSION } from "./prompts/version.js";
import { generatedPlanSchema, type GeneratedPlan, type GeneratedQuestion } from "./schema.js";
import { namedChapters } from "./scripture.js";
import { assertPassageReads, readsInEveryBundledTranslation } from "./scripture-text.js";
import { dayContentSchema, dayOutputSchema, mapDay, type DayContent } from "./stages/day.js";
import { mapOutline, outlineOutputSchema, outlineSchema, type Outline, type OutlineDay } from "./stages/outline.js";
import { QUICK_CHECK_MIN, mapQuiz, quizContentSchema, quizOutputSchema, type PassageText, type QuizContent } from "./stages/quiz.js";
import { stepRunner, type PipelineDeps, type StepRunner } from "./step-runner.js";
import { normalizeSourceText } from "./transcript.js";
import { validatePlanStructure } from "./validation.js";

export type { PipelineDeps, StageCaller, StageEvent, StageKind, StageRequest, StageResponse, StepCheckpoint } from "./step-runner.js";

/**
 * Writes a plan in three steps so each gets the model's full attention: the
 * plan (title, About this plan, each day's passage), then each day's study in
 * parallel, then each day's quiz from that day's finished reading. Every step's
 * output is verified before the next uses it, and steps an earlier run finished
 * are reused.
 */
export async function generateStagedPlan(input: PlanGenerationInput, deps: PipelineDeps): Promise<GeneratedPlan> {
  // A day may only study a chapter the sermon names: list them for the model,
  // and stop before any call when there are none.
  const chapters = namedChapters(sourceText(input));
  if (chapters.length === 0) throw new AppError("INTERNAL", "The sermon names no chapter of Scripture to study", { permanent: true });
  const run = runner(input, deps);

  const outline = await run.step({
    kind: "outline", stage: "plan", key: "plan", resumable: true, instructions: OUTLINE_INSTRUCTIONS,
    task: (rejected) => outlineTask(input, chapters, rejected), schema: outlineOutputSchema, schemaName: "sundaybest_plan", saved: outlineSchema,
    map: async (raw) => {
      const mapped = mapOutline(raw, input);
      for (const day of mapped.days) await assertPassageReads(day.scripture, deps.bible);
      return mapped;
    },
  });

  // Days and quizzes are saved under what they were written from, so a new
  // outline never picks up days written for an old one.
  const outlineMark = fingerprint(outline);
  const writeDay = (day: OutlineDay, avoid: readonly string[]) => run.step({
    kind: "day", stage: `day ${day.dayNumber}`, key: `day ${day.dayNumber}@${outlineMark}`, resumable: avoid.length === 0,
    instructions: DAY_INSTRUCTIONS, task: (rejected) => dayTask(input, outline, day, avoid, rejected),
    schema: dayOutputSchema, schemaName: "sundaybest_day", saved: dayContentSchema,
    map: async (raw) => {
      const content = mapDay(raw, input, day, outline);
      const supportingScriptures = [];
      for (const passage of content.supportingScriptures) {
        if (await readsInEveryBundledTranslation(passage.reference, deps.bible)) supportingScriptures.push(passage);
      }
      return { ...content, reflections: unseen(content.reflections, avoid, "reflections", day), supportingScriptures };
    },
  });
  const drafts = await Promise.all(outline.days.map((day) => writeDay(day, [])));
  const contents = await keepDistinct(outline.days, drafts, (content) => content.reflections,
    (content, reflections) => ({ ...content, reflections }), 1, writeDay);

  const quizzes = input.quickCheckEnabled
    ? await writeQuizzes(input, outline.days, contents.map((content) => content.readingParagraphs), run, deps.bible)
    : outline.days.map(() => null);
  return assemble(input, outline, contents, quizzes, run.model());
}

/**
 * Adds Quick Checks to a finished plan written without them, leaving its days
 * as they are: a reused plan needs only its quizzes written.
 */
export async function addStagedQuickChecks(input: PlanGenerationInput, plan: GeneratedPlan, deps: PipelineDeps): Promise<GeneratedPlan> {
  const days = plan.days.map((day): OutlineDay => ({ dayNumber: day.dayNumber, title: day.readingTitle, focus: day.focus ?? day.readingTitle, scripture: day.scripture }));
  const quizzes = await writeQuizzes(input, days, plan.days.map((day) => day.readingParagraphs), runner(input, deps), deps.bible);
  const withQuizzes = { ...plan, days: plan.days.map((day, index) => ({ ...day, quickCheck: quizzes[index]! })) };
  validatePlanStructure(withQuizzes, input);
  return withQuizzes;
}

function runner(input: PlanGenerationInput, deps: PipelineDeps): StepRunner {
  return stepRunner(sourceContext(input), `sermon:${input.sermon.externalId}`, deps);
}

/**
 * One quiz per day, in parallel, from that day's reading. A quiz left short by
 * questions that fail verification keeps the ones that passed, and the retry
 * asks only for the rest.
 */
async function writeQuizzes(input: PlanGenerationInput, days: readonly OutlineDay[], readings: ReadonlyArray<readonly string[]>,
  run: StepRunner, bible: BibleProvider): Promise<QuizContent[]> {
  const passages = await Promise.all(days.map((day) => passageText(day, bible)));
  const writeQuiz = (day: OutlineDay, avoid: readonly string[]) => {
    const index = day.dayNumber - 1;
    const avoided = new Set(avoid.map(normalizeSourceText));
    let kept: GeneratedQuestion[] = [];
    return run.step({
      kind: "quiz", stage: `quiz ${day.dayNumber}`, key: `quiz ${day.dayNumber}@${fingerprint([day.scripture, readings[index]])}`,
      resumable: avoid.length === 0, instructions: QUIZ_INSTRUCTIONS,
      task: (rejected) => quizTask(day, readings[index]!, passages[index]!, [...avoid, ...kept.map((question) => question.prompt)],
        kept.length > 0 ? QUICK_CHECK_MIN - kept.length : null, rejected),
      schema: quizOutputSchema, schemaName: "sundaybest_quiz", saved: quizContentSchema,
      map: (raw) => {
        const quiz = mapQuiz(raw, { input, day, passageText: passages[index]! }, kept);
        const questions = quiz.questions.filter((question) => !avoided.has(normalizeSourceText(question.prompt)));
        if (questions.length < QUICK_CHECK_MIN) {
          kept = questions;
          throw new AppError("INTERNAL", `The quiz for day ${day.dayNumber} has ${questions.length} usable questions; at least ${QUICK_CHECK_MIN} are needed`);
        }
        return { title: quiz.title, questions };
      },
    });
  };
  const drafted = await Promise.all(days.map((day) => writeQuiz(day, [])));
  return keepDistinct(days, drafted, (quiz) => quiz.questions.map((question) => question.prompt),
    (quiz, prompts) => ({ ...quiz, questions: quiz.questions.filter((question) => prompts.includes(question.prompt)) }), QUICK_CHECK_MIN, writeQuiz);
}

function sourceText(input: PlanGenerationInput): string {
  return input.transcriptSegments?.map((segment) => segment.text).join(" ") ?? input.transcript;
}

/** A short, stable name for what a step was written from. */
function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);
}

/** Items not already used; fails the step when none are left, so it is written again. */
function unseen(items: readonly string[], avoid: readonly string[], what: string, day: OutlineDay): string[] {
  const used = new Set(avoid.map(normalizeSourceText));
  const fresh = items.filter((item) => !used.has(normalizeSourceText(item)));
  if (fresh.length === 0) throw new AppError("INTERNAL", `Day ${day.dayNumber}'s ${what} repeat earlier days`);
  return fresh;
}

/**
 * Days are written in parallel, so they can repeat one another. In day order,
 * drop anything an earlier day already used; a day left with fewer than `min`
 * items is written again, told what to avoid.
 */
async function keepDistinct<T>(
  days: readonly OutlineDay[],
  drafts: readonly T[],
  itemsOf: (draft: T) => string[],
  withItems: (draft: T, items: string[]) => T,
  min: number,
  rewrite: (day: OutlineDay, avoid: readonly string[]) => Promise<T>,
): Promise<T[]> {
  const used: string[] = [];
  const kept: T[] = [];
  for (const [index, day] of days.entries()) {
    const seen = new Set(used.map(normalizeSourceText));
    let draft: T = drafts[index]!;
    let items = itemsOf(draft).filter((item) => !seen.has(normalizeSourceText(item)));
    if (items.length < min) {
      draft = await rewrite(day, used);
      items = itemsOf(draft);
    }
    const distinct = withItems(draft, items);
    kept.push(distinct);
    used.push(...items);
  }
  return kept;
}

async function passageText(day: OutlineDay, bible: BibleProvider): Promise<PassageText> {
  const [BSB, KJV] = await Promise.all((["BSB", "KJV"] as const).map((translation) =>
    bible.getPassage({ reference: day.scripture.reference, translation }).then((passage) => passage.verses)));
  return { BSB: BSB!, KJV: KJV! };
}

function assemble(
  input: PlanGenerationInput,
  outline: Outline,
  contents: readonly DayContent[],
  quizzes: ReadonlyArray<QuizContent | null>,
  model: string | null,
): GeneratedPlan {
  const plan = generatedPlanSchema.safeParse({
    title: outline.title,
    generator: { version: GENERATOR_VERSION, promptVersion: PROMPT_VERSION, provider: "openai", model },
    about: outline.about,
    days: outline.days.map((day, index) => ({
      dayNumber: day.dayNumber,
      readingTitle: day.title,
      focus: day.focus,
      scripture: day.scripture,
      ...contents[index]!,
      quickCheck: quizzes[index] ?? null,
    })),
  });
  if (!plan.success) throw new AppError("INTERNAL", "The assembled plan failed domain validation");
  validatePlanStructure(plan.data, input);
  return plan.data;
}
