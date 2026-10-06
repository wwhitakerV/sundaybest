import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";

import type { Database } from "../db/client.js";
import {
  planDays,
  planGenerations,
  plans,
  prayers,
  quizChoices,
  quizQuestions,
  quizzes,
  reflectionPrompts,
  scriptureReferences,
} from "../db/schema.js";
import { GENERATOR_VERSION, PROMPT_VERSION } from "../generation/prompts/version.js";
import { generatedPlanSchema, type GeneratedPlan } from "../generation/schema.js";

export interface ReuseRequest {
  sermonId: string;
  lengthDays: number;
  /** The plan being built, which must not be its own source. */
  planId: string;
}

/**
 * The content of a finished plan for the same sermon and length, written by
 * the current generator and prompt, preferring one with Quick Checks since it
 * serves either setting: the caller drops its quizzes, or writes only the
 * quizzes for one without. A prompt or generator change bumps its version and
 * plans are written fresh again. Development content is never reused. Null
 * when there is no match, or when the stored content no longer passes the plan
 * schema.
 */
export async function findReusablePlan(db: Database, request: ReuseRequest): Promise<GeneratedPlan | null> {
  const [source] = await db
    .select({ planId: planGenerations.planId, provider: planGenerations.modelProvider, model: planGenerations.modelName })
    .from(planGenerations)
    .where(and(
      eq(planGenerations.sermonId, request.sermonId),
      eq(planGenerations.requestedLength, request.lengthDays),
      eq(planGenerations.status, "completed"),
      eq(planGenerations.generatorVersion, GENERATOR_VERSION),
      eq(planGenerations.promptVersion, PROMPT_VERSION),
      ne(planGenerations.modelProvider, "development"),
      ne(planGenerations.planId, request.planId),
    ))
    .orderBy(desc(planGenerations.quickCheckEnabled), desc(planGenerations.finishedAt))
    .limit(1);
  if (!source?.provider) return null;

  const [plan] = await db.select({ title: plans.title, about: plans.about }).from(plans).where(eq(plans.id, source.planId));
  if (!plan) return null;
  const days = await db
    .select({ day: planDays, scripture: scriptureReferences })
    .from(planDays)
    .innerJoin(scriptureReferences, eq(scriptureReferences.id, planDays.scriptureReferenceId))
    .where(eq(planDays.planId, source.planId))
    .orderBy(asc(planDays.dayNumber));
  const dayIds = days.map(({ day }) => day.id);
  if (dayIds.length === 0) return null;
  const [reflections, dayPrayers, dayQuizzes] = await Promise.all([
    db.select().from(reflectionPrompts).where(inArray(reflectionPrompts.planDayId, dayIds)).orderBy(asc(reflectionPrompts.position)),
    db.select().from(prayers).where(inArray(prayers.planDayId, dayIds)),
    db.select().from(quizzes).where(eq(quizzes.planId, source.planId)),
  ]);
  const questions = await loadQuestions(db, dayQuizzes.map((quiz) => quiz.id));

  const parsed = generatedPlanSchema.safeParse({
    title: plan.title,
    about: plan.about,
    generator: { version: GENERATOR_VERSION, promptVersion: PROMPT_VERSION, provider: source.provider, model: source.model },
    days: days.map(({ day, scripture }) => {
      const quiz = dayQuizzes.find((candidate) => candidate.planDayId === day.id);
      const prayer = dayPrayers.find((candidate) => candidate.planDayId === day.id);
      return {
        dayNumber: day.dayNumber,
        readingTitle: day.readingTitle,
        focus: day.focus,
        readingParagraphs: day.readingParagraphs,
        sermonQuote: day.sermonQuote,
        clipStartSeconds: day.clipStartSeconds,
        clipEndSeconds: day.clipEndSeconds,
        scripture: { book: scripture.book, chapter: scripture.chapter, verseStart: scripture.verseStart, verseEnd: scripture.verseEnd, reference: scripture.canonicalReference },
        reflections: reflections.filter((reflection) => reflection.planDayId === day.id).map((reflection) => reflection.question),
        prayer: prayer ? { title: prayer.title, text: prayer.text } : null,
        supportingScriptures: day.supportingScriptures,
        quickCheck: quiz ? { title: quiz.title, questions: questions.get(quiz.id) ?? [] } : null,
      };
    }),
  });
  return parsed.success ? parsed.data : null;
}

async function loadQuestions(db: Database, quizIds: string[]): Promise<Map<string, unknown[]>> {
  const byQuiz = new Map<string, unknown[]>();
  if (quizIds.length === 0) return byQuiz;
  const rows = await db.select().from(quizQuestions).where(inArray(quizQuestions.quizId, quizIds)).orderBy(asc(quizQuestions.position));
  const choices = rows.length === 0 ? [] : await db.select().from(quizChoices)
    .where(inArray(quizChoices.questionId, rows.map((row) => row.id))).orderBy(asc(quizChoices.position));
  for (const row of rows) {
    const question = {
      kind: row.kind,
      source: row.source,
      prompt: row.prompt,
      scriptureReference: row.scriptureReference,
      explanation: row.explanation,
      variants: row.variants ?? null,
      choices: choices.filter((choice) => choice.questionId === row.id)
        .map((choice) => ({ label: choice.label, text: choice.text, correct: choice.isCorrect })),
    };
    byQuiz.set(row.quizId, [...(byQuiz.get(row.quizId) ?? []), question]);
  }
  return byQuiz;
}
