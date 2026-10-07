import { studyDaySchema } from "@/core/api/contracts";
import type { QuickCheckQuestionView, StudyDayContent } from "@/features/plans/types";

const ID = "00000000-0000-4000-8000-000000000001";

/** A Daily Study's content for one day, parsed as the API would give it. */
export function studyDayContent(): StudyDayContent {
  const day = studyDaySchema.parse({
    id: ID,
    planId: ID,
    dayNumber: 2,
    reading: {
      title: "Grace is received",
      paragraphs: [{ heading: "Grace First", content: "Read this." }],
      sermonQuote: null,
      sermonClip: null,
    },
    scripture: {
      id: ID,
      reference: "John 3:16",
      book: "John",
      chapter: 3,
      verseStart: 16,
      verseEnd: 16,
      translation: "BSB",
      verses: [{ number: 16, text: "For God so loved the world." }],
      cacheAllowed: true,
    },
    reflectionPrompts: [{ id: ID, order: 1, question: "Where did you see grace today?" }],
    prayer: { id: ID, title: "Prayer", text: "Amen." },
    quickCheckId: null,
    progress: {
      status: "available",
      completedSteps: [],
      scheduledOn: null,
      startedAt: null,
      completedAt: null,
    },
  });
  return {
    day,
    scripture: day.scripture,
    reflections: day.reflectionPrompts,
    prayer: day.prayer,
  };
}

/** A multiple-choice Quick Check question, unanswered. */
export function quizQuestion(
  overrides: Partial<QuickCheckQuestionView> = {},
): QuickCheckQuestionView {
  return {
    id: "q1",
    order: 1,
    kind: "multipleChoice",
    source: "sermon",
    prompt: "What comes before obedience?",
    choices: [
      { id: "a", label: "A", text: "Grace" },
      { id: "b", label: "B", text: "Law" },
    ],
    scriptureReference: null,
    correctChoiceId: null,
    explanation: null,
    ...overrides,
  };
}
