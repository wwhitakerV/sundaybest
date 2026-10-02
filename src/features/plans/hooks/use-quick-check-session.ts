import { useRouter } from "expo-router";

import { dayCompleteHref } from "@/entities/plan";
import { useModalSession } from "@/hooks/use-modal-session";
import {
  selectionFeedback,
  successFeedback,
  tapFeedback,
  warningFeedback,
} from "@/core/haptics/haptics";
import {
  getAttemptAnswers,
  getPrayerForDay,
  getQuestionResult,
  getQuizAttempt,
  getQuizForDay,
  getQuizQuestions,
  getQuizScore,
  getQuizStatus,
  isChoiceCorrect,
  useAppSelector,
  useStoreActions,
} from "@/core/store";
import {
  getQuickCheckAction,
  getQuickCheckPage,
  type QuickCheckAction,
} from "../logic/quick-check";
import { useStudyRoute } from "./use-study-route";

/**
 * Quick Check's view model: the day's quiz from the store, its latest
 * attempt — begun or resumed on the question it's up to — which page it's
 * on (the start, a question, or the score), and the one action available.
 *
 * Picking, checking, moving on, and finishing are the store's actions — and
 * the store decides what's allowed and whether an answer is right. Done, once
 * it's taken, completes the day — a day with a Quick Check is done only then —
 * and Day Complete replaces it. Close leaves the session with the day not done. `found: false` when the day has no quiz.
 */
export function useQuickCheckSession() {
  const router = useRouter();
  const session = useModalSession();
  const actions = useStoreActions();
  const { planId, dayNumber, day } = useStudyRoute();
  const prayer = useAppSelector((state) => (day ? getPrayerForDay(state, day.id) : null));
  const quiz = useAppSelector((state) => (day ? getQuizForDay(state, day.id) : null));
  const quizId = quiz?.id ?? "";
  const questions = useAppSelector((state) => getQuizQuestions(state, quizId));
  const attempt = useAppSelector((state) => getQuizAttempt(state, quizId));
  const status = useAppSelector((state) => getQuizStatus(state, quizId));
  const attemptId = attempt?.id ?? "";
  const answers = useAppSelector((state) => getAttemptAnswers(state, attemptId));
  const score = useAppSelector((state) => getQuizScore(state, attemptId));
  const results = useAppSelector((state) =>
    questions.map((question) => ({
      question,
      result: getQuestionResult(state, attemptId, question.id),
    })),
  );
  const currentIndex = questions.findIndex(
    (question) => question.id === attempt?.currentQuestionId,
  );
  const page = getQuickCheckPage({ status, currentIndex, questionCount: questions.length });
  // Whether the choice picked is right — the store's call — so checking it
  // can answer in the hand as well as on screen.
  const pickIsRight = useAppSelector((state) =>
    attempt?.currentQuestionId && attempt.selectedChoiceId
      ? isChoiceCorrect(state, attempt.currentQuestionId, attempt.selectedChoiceId)
      : false,
  );

  // Left before it's done, the day isn't done either: back out of the session.
  const close = () => session.exit();
  /** The Quick Check taken: the day's done, and Day Complete takes its place. */
  const finishDay = () => {
    if (day && day.status !== "completed") actions.finishPlanDay(day.id, prayer?.id ?? null);
    router.replace(dayCompleteHref(planId, dayNumber));
  };
  if (!quiz || questions.length === 0) return { found: false, page } as const;

  const currentResult = results.at(currentIndex)?.result ?? "unanswered";

  return {
    found: true,
    dayNumber,
    quiz,
    questions,
    attempt,
    status,
    page,
    currentIndex,
    current: questions.at(currentIndex),
    currentResult,
    action: getQuickCheckAction({
      status,
      result: currentResult,
      hasSelection: Boolean(attempt?.selectedChoiceId),
      isLastQuestion: currentIndex === questions.length - 1,
    }),
    answers,
    results,
    score,
    act: ({ kind }: QuickCheckAction) => {
      if (kind === "start") {
        tapFeedback();
        actions.startQuizAttempt(quizId);
      } else if (kind === "check") {
        if (pickIsRight) successFeedback();
        else warningFeedback();
        actions.submitQuizAnswer(attemptId);
      } else if (kind === "next") {
        tapFeedback();
        actions.moveToNextQuestion(attemptId);
      } else if (kind === "finish") {
        successFeedback();
        actions.completeQuizAttempt(attemptId);
      } else finishDay();
    },
    pick: (choiceId: string) => {
      if (choiceId !== attempt?.selectedChoiceId) selectionFeedback();
      actions.selectQuizAnswer(attemptId, choiceId);
    },
    close,
  } as const;
}
