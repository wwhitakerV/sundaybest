import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { dayCompleteHref } from "@/entities/plan";
import { useModalSession } from "@/hooks/use-modal-session";
import {
  useCompleteQuizAttemptMutation,
  useCompleteStudyDayMutation,
  useQuizSessionQuery,
  useStartQuizAttemptMutation,
  useSubmitQuizAnswerMutation,
} from "@/core/api/queries";
import {
  selectionFeedback,
  successFeedback,
  tapFeedback,
  warningFeedback,
} from "@/core/haptics/haptics";
import {
  getQuickCheckAction,
  getQuickCheckPage,
  type QuickCheckAction,
} from "../logic/quick-check";
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
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!apiSession || apiSession.attempt.status === "completed") return;
    const index = apiSession.quiz.questions.findIndex(
      ({ id }) => id === apiSession.attempt.currentQuestionId,
    );
    setCurrentIndex(
      index >= 0
        ? index
        : Math.max(0, Math.min(apiSession.quiz.questions.length - 1, apiSession.answers.length)),
    );
  }, [
    apiSession?.answers.length,
    apiSession?.attempt.currentQuestionId,
    apiSession?.attempt.id,
    apiSession?.attempt.status,
    apiSession?.quiz.questions,
  ]);

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
    ? apiSession?.answers.find((answer) => answer.questionId === current.id) ?? null
    : null;
  const currentResult: QuestionResult = currentAnswer
    ? currentAnswer.correct
      ? "correct"
      : "incorrect"
    : "unanswered";
  const selectedChoiceId = current ? (selectedChoices[current.id] ?? null) : null;
  const score = apiSession?.score ?? null;
  const results = questions.map((question) => {
    const answer = apiSession?.answers.find((candidate) => candidate.questionId === question.id);
    const result: QuestionResult = answer
      ? answer.correct
        ? "correct"
        : "incorrect"
      : "unanswered";
    return { question, result };
  });
  const page = getQuickCheckPage({ status, currentIndex, questionCount });
  const busy =
    startAttempt.isPending ||
    submitAnswer.isPending ||
    completeAttempt.isPending ||
    completeDay.isPending;
  const action = getQuickCheckAction({
    status,
    result: currentResult,
    hasSelection: selectedChoiceId !== null,
    isLastQuestion: currentIndex === questionCount - 1,
  });
  const loading = route.loading || (shouldLoadSession && sessionQuery.isPending);
  const found = Boolean(plan && day && standing && quizId && questionCount > 0);

  async function act(nextAction: QuickCheckAction) {
    if (busy || !nextAction.enabled) return;

    try {
      if (nextAction.kind === "start") {
        tapFeedback();
        const started = await startAttempt.mutateAsync();
        const index = started.quiz.questions.findIndex(
          ({ id }) => id === started.attempt.currentQuestionId,
        );
        setCurrentIndex(
          index >= 0
            ? index
            : Math.max(0, Math.min(started.quiz.questions.length - 1, started.answers.length)),
        );
        return;
      }

      if (nextAction.kind === "check") {
        if (!current || !selectedChoiceId || !attemptId) return;
        const answer = await submitAnswer.mutateAsync({
          questionId: current.id,
          choiceId: selectedChoiceId,
        });
        if (answer.correct) successFeedback();
        else warningFeedback();
        return;
      }

      if (nextAction.kind === "next") {
        tapFeedback();
        setCurrentIndex((index) => Math.min(questionCount - 1, index + 1));
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
    results,
    score,
    busy,
    act,
    pick: (choiceId: string) => {
      if (!current || currentAnswer || busy) return;
      if (choiceId !== selectedChoiceId) selectionFeedback();
      setSelectedChoices((existing) => ({ ...existing, [current.id]: choiceId }));
    },
    selectedFor: (questionId: string) => selectedChoices[questionId] ?? null,
    close: () => sessionModal.exit(),
  } as const;
}
