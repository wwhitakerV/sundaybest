import { useMemo, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { dayCompleteHref } from "@/entities/plan";
import { useModalSession } from "@/hooks/use-modal-session";
import {
  useCompleteQuizAttemptMutation,
  useQuizSessionQuery,
  useStartQuizAttemptMutation,
  useSubmitQuizAnswerMutation,
} from "@/core/api/quiz-queries";
import { useCompleteStudyDayMutation } from "@/core/api/study-queries";
import { successFeedback, tapFeedback, warningFeedback } from "@/core/haptics/haptics";
import {
  getQuickCheckAction,
  getQuickCheckPage,
  getResumeIndex,
  type QuickCheckAction,
} from "../logic/quick-check";
import { describeQuizReview } from "../logic/quick-check-review";
import type { QuestionResult, QuickCheckQuestionView, QuizStatus } from "../types";
import { useStudyRoute } from "./use-study-route";

/** Quick Check backed by server-owned attempts, answers, scoring, and day completion. */
export function useQuickCheckSession() {
  const router = useRouter();
  const sessionModal = useModalSession();
  const route = useStudyRoute();
  const { planId, dayNumber, plan, day } = route;
  const summaryDay = plan?.days.find((candidate) => candidate.dayNumber === dayNumber) ?? null;
  const standing = summaryDay?.quickCheck ?? null;
  const quizId = day?.quickCheckId ?? standing?.id ?? "";
  const shouldLoadSession = Boolean(standing && standing.status !== "notStarted" && quizId);
  const sessionQuery = useQuizSessionQuery(quizId, shouldLoadSession);
  const startAttempt = useStartQuizAttemptMutation(quizId);
  const apiSession = sessionQuery.data ?? null;
  const attemptId = apiSession?.attempt.id ?? "";
  const submitAnswer = useSubmitQuizAnswerMutation(quizId, attemptId);
  const completeAttempt = useCompleteQuizAttemptMutation(quizId, attemptId, planId);
  const completeDay = useCompleteStudyDayMutation(planId, dayNumber);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});
  // Where the reader is, in this attempt. Until they act, it's where the
  // attempt opens (`getResumeIndex`); from then on it's theirs, so a refetch
  // after an answer never moves them.
  const [position, setPosition] = useState<{ attemptId: string; index: number } | null>(null);
  const currentIndex =
    position && position.attemptId === attemptId
      ? position.index
      : apiSession
        ? getResumeIndex(
            apiSession.quiz.questions.map(({ id }) => id),
            apiSession.answers.map(({ questionId }) => questionId),
          )
        : 0;

  const status: QuizStatus = apiSession?.attempt.status ?? standing?.status ?? "notStarted";
  const questionCount = apiSession?.quiz.questions.length ?? standing?.questionCount ?? 0;
  const questions = useMemo<QuickCheckQuestionView[]>(() => {
    if (!apiSession) return [];
    const feedbackByQuestion = new Map(
      apiSession.answers.map((answer) => [answer.questionId, answer] as const),
    );
    return apiSession.quiz.questions.map((question) => {
      const feedback = feedbackByQuestion.get(question.id);
      return {
        ...question,
        correctChoiceId: feedback?.correctChoiceId ?? null,
        explanation: feedback?.explanation ?? null,
      };
    });
  }, [apiSession]);
  const current = questions.at(currentIndex);
  const currentAnswer = current
    ? (apiSession?.answers.find((answer) => answer.questionId === current.id) ?? null)
    : null;
  const currentResult: QuestionResult = currentAnswer
    ? currentAnswer.correct
      ? "correct"
      : "incorrect"
    : "unanswered";
  const selectedChoiceId = current ? (selectedChoices[current.id] ?? null) : null;
  const score = apiSession?.score ?? null;
  const review = describeQuizReview(questions, apiSession?.answers ?? []);
  const page = getQuickCheckPage({ status, currentIndex, questionCount });
  const busy =
    startAttempt.isPending ||
    submitAnswer.isPending ||
    completeAttempt.isPending ||
    completeDay.isPending;
  const action = getQuickCheckAction({
    status,
    result: currentResult,
    isLastQuestion: currentIndex === questionCount - 1,
  });
  const loading = route.loading || (shouldLoadSession && sessionQuery.isPending);
  const found = Boolean(plan && day && standing && quizId && questionCount > 0);

  async function act(nextAction: QuickCheckAction) {
    if (busy || !nextAction.enabled) return;

    try {
      if (nextAction.kind === "start") {
        tapFeedback();
        await startAttempt.mutateAsync();
        return;
      }

      if (nextAction.kind === "next") {
        tapFeedback();
        setPosition({ attemptId, index: Math.min(questionCount - 1, currentIndex + 1) });
        return;
      }

      if (nextAction.kind === "finish") {
        await completeAttempt.mutateAsync();
        successFeedback();
        return;
      }

      await completeDay.mutateAsync();
      successFeedback();
      router.replace(dayCompleteHref(planId, dayNumber));
    } catch {
      Alert.alert(
        "Couldn't update Quick Check",
        "SundayBest couldn't save that answer. Check your connection and try again.",
      );
    }
  }

  /** A tap on an answer is the answer: it's checked at once, and the verdict shows. */
  async function answer(choiceId: string) {
    if (!current || currentAnswer || busy || !attemptId) return;
    setPosition({ attemptId, index: currentIndex });
    setSelectedChoices((existing) => ({ ...existing, [current.id]: choiceId }));
    try {
      const checked = await submitAnswer.mutateAsync({ questionId: current.id, choiceId });
      if (checked.correct) successFeedback();
      else warningFeedback();
    } catch {
      setSelectedChoices(({ [current.id]: _unsaved, ...rest }) => rest);
      Alert.alert(
        "Couldn't update Quick Check",
        "SundayBest couldn't save that answer. Check your connection and try again.",
      );
    }
  }

  return {
    found,
    loading,
    error: route.error ?? (shouldLoadSession ? sessionQuery.error : null),
    retry: async () => {
      await route.refetch();
      if (shouldLoadSession) await sessionQuery.refetch();
    },
    dayNumber,
    questionCount,
    questions,
    attempt: apiSession?.attempt ?? null,
    status,
    page,
    currentIndex,
    current,
    currentResult,
    selectedChoiceId,
    action,
    answers: apiSession?.answers ?? [],
    review,
    score,
    busy,
    act,
    pick: (choiceId: string) => void answer(choiceId),
    selectedFor: (questionId: string) => selectedChoices[questionId] ?? null,
    close: () => sessionModal.exit(),
  } as const;
}
