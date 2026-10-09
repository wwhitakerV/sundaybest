import type { ApiQuizSession } from "@/core/api/contracts";
import type { Id } from "@/types/domain";
import type { QuestionResult, QuickCheckAnswerView, QuickCheckQuestionView } from "../types";
import { getQuestionKicker, splitVersePrompt } from "./quick-check";

/** One question as the score page reviews it. */
export type QuizReviewItem = {
  id: Id;
  /** Two digits: "01". */
  number: string;
  kicker: string;
  prompt: string;
  /** A verse to finish, with its right word in the blank — or null for any other question. */
  verse: { before: string; answer: string; after: string } | null;
  result: QuestionResult;
  /** The words answered, if answered. */
  yours: string | null;
  /** The right words, only when the answer missed them. */
  rightAnswer: string | null;
  /** Why the right answer is right: its reference, then its explanation. */
  why: string | null;
};

/**
 * A finished Quick Check, question by question, for its score page: what
 * was asked, what was answered, the right answer where it was missed, and
 * why — in the quiz's order.
 */
export function describeQuizReview(
  questions: readonly QuickCheckQuestionView[],
  answers: readonly QuickCheckAnswerView[],
): QuizReviewItem[] {
  return questions.map((question, index) => {
    const answer = answers.find((candidate) => candidate.questionId === question.id);
    const textOf = (choiceId: Id | null | undefined) =>
      question.choices.find((choice) => choice.id === choiceId)?.text ?? null;
    const right = textOf(answer?.correctChoiceId ?? question.correctChoiceId);
    const split = question.kind === "finishTheVerse" ? splitVersePrompt(question.prompt) : null;
    const reason = answer?.explanation ?? null;

    return {
      id: question.id,
      number: String(index + 1).padStart(2, "0"),
      kicker: getQuestionKicker(question),
      prompt: question.prompt,
      verse: split && right ? { before: split.before, answer: right, after: split.after } : null,
      result: answer ? (answer.correct ? "correct" : "incorrect") : "unanswered",
      yours: textOf(answer?.choiceId),
      rightAnswer: answer && !answer.correct ? right : null,
      why: reason
        ? [answer?.scriptureReference ?? question.scriptureReference, reason]
            .filter(Boolean)
            .join(". ")
        : null,
    };
  });
}

/** How a review adds up: the answers right, and the ones missed. */
export function tallyQuizReview(items: readonly QuizReviewItem[]): {
  right: number;
  missed: number;
} {
  return {
    right: items.filter((item) => item.result === "correct").length,
    missed: items.filter((item) => item.result === "incorrect").length,
  };
}

/**
 * A session's questions as the Quick Check shows them, each with its right
 * answer and why once it's been answered.
 */
export function toQuestionViews(session: ApiQuizSession | null): QuickCheckQuestionView[] {
  if (!session) return [];
  const feedbackByQuestion = new Map(
    session.answers.map((answer) => [answer.questionId, answer] as const),
  );
  return session.quiz.questions.map((question) => {
    const feedback = feedbackByQuestion.get(question.id);
    return {
      ...question,
      correctChoiceId: feedback?.correctChoiceId ?? null,
      explanation: feedback?.explanation ?? null,
    };
  });
}

/** A review with what was missed first — each keeping its question's number. */
export function missedFirst(items: readonly QuizReviewItem[]): QuizReviewItem[] {
  return [
    ...items.filter((item) => item.result === "incorrect"),
    ...items.filter((item) => item.result !== "incorrect"),
  ];
}
