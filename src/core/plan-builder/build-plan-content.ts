import type {
  BibleTranslation,
  IsoDateTime,
  Plan,
  PlanDay,
  Prayer,
  Quiz,
  QuizQuestion,
  Reflection,
  ScripturePassage,
} from "@/types/domain";
import type { GeneratedPlanContent } from "@/core/store";

import { DAY_TEMPLATES } from "./day-templates";
import type { SermonPreview } from "./sermon-catalog";

const LABELS = ["A", "B", "C", "D"] as const;

export type BuildInput = {
  plan: Plan;
  sermon: SermonPreview;
  translation: BibleTranslation;
  /** When the build finished; every record is created then. */
  at: IsoDateTime;
};

/**
 * What a mock build produces for a plan: one day per day of its length, each
 * with its reading (and the part of the sermon it's from), Scripture, a
 * reflection question, and a prayer — and a two-question Quick Check per day
 * when the plan has one. Pure and deterministic; IDs are derived from the
 * plan's (`<plan>-day-<n>`, …).
 */
export function buildMockPlanContent({
  plan,
  sermon,
  translation,
  at,
}: BuildInput): GeneratedPlanContent {
  const stamp = { createdAt: at, updatedAt: at };
  const templates = DAY_TEMPLATES.slice(0, plan.lengthDays);
  // Each day's clip comes from its own stretch of the sermon, in order.
  const clipLength = Math.floor(sermon.durationSeconds / (templates.length + 1));

  const days: PlanDay[] = [];
  const scripture: ScripturePassage[] = [];
  const reflections: Reflection[] = [];
  const prayers: Prayer[] = [];
  const quizzes: Quiz[] = [];
  const quizQuestions: QuizQuestion[] = [];

  templates.forEach((template, index) => {
    const dayNumber = index + 1;
    const dayId = `${plan.id}-day-${dayNumber}`;
    const { verses } = template.passage;
    const passage: ScripturePassage = {
      id: `${dayId}-scripture`,
      ...stamp,
      reference: template.passage.reference,
      book: template.passage.book,
      chapter: template.passage.chapter,
      verseStart: verses.at(0)?.number ?? 1,
      verseEnd: verses.at(-1)?.number ?? 1,
      translation,
      verses: [...verses],
    };
    scripture.push(passage);
    days.push({
      id: dayId,
      ...stamp,
      planId: plan.id,
      dayNumber,
      status: dayNumber === 1 ? "available" : "locked",
      reading: {
        title: template.title,
        paragraphs: [...template.paragraphs],
        sermonQuote: template.sermonQuote,
        sermonClip:
          clipLength > 0
            ? { startSeconds: clipLength * dayNumber, endSeconds: clipLength * dayNumber + 120 }
            : null,
      },
      scriptureId: passage.id,
      completedSteps: [],
      scheduledOn: null,
      startedAt: null,
      completedAt: null,
    });
    reflections.push({
      id: `${dayId}-reflection-1`,
      ...stamp,
      planDayId: dayId,
      order: 1,
      question: template.reflection,
      answer: null,
      answeredAt: null,
    });
    prayers.push({
      id: `${dayId}-prayer`,
      ...stamp,
      planDayId: dayId,
      title: "A prayer for today",
      text: template.prayer,
      prayedAt: null,
    });

    if (!plan.quickCheckEnabled) return;
    const quizId = `${dayId}-quiz`;
    quizzes.push({
      id: quizId,
      ...stamp,
      planId: plan.id,
      planDayId: dayId,
      title: `Day ${dayNumber} quick check`,
    });
    template.questions.forEach((question, questionIndex) => {
      const questionId = `${quizId}-q${questionIndex + 1}`;
      // Rotated by a fixed amount per question, so the right answer isn't
      // always in the same place — the same plan always gets the same order.
      const shift = (dayNumber + questionIndex) % question.choices.length;
      const rotated = [...question.choices.slice(shift), ...question.choices.slice(0, shift)];
      const correctText = question.choices.at(question.correctIndex);
      const choices = rotated.map((text, choiceIndex) => {
        const label = LABELS.at(choiceIndex) ?? String(choiceIndex + 1);
        return { id: `${questionId}-${label.toLowerCase()}`, label, text };
      });
      quizQuestions.push({
        id: questionId,
        ...stamp,
        quizId,
        order: questionIndex + 1,
        kind: question.kind,
        source: question.source,
        prompt: question.prompt,
        choices,
        correctChoiceId: choices.find((choice) => choice.text === correctText)?.id ?? "",
        explanation: question.explanation,
        scriptureReference: question.scriptureReference,
      });
    });
  });

  return {
    title: sermon.title,
    sermon: {
      title: sermon.title,
      church: sermon.church,
      thumbnailUrl: sermon.thumbnailUrl,
      thumbnailColors: sermon.thumbnailColors,
      durationSeconds: sermon.durationSeconds,
      publishedOn: sermon.publishedOn,
      transcriptStatus: sermon.transcriptStatus,
      transcript: [],
    },
    days,
    scripture,
    reflections,
    prayers,
    quizzes,
    quizQuestions,
  };
}
