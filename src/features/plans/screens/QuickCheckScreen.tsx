import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Animated from "react-native-reanimated";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import {
  getAttemptAnswers,
  getQuestionResult,
  getQuizAttempt,
  getQuizForDay,
  getQuizQuestions,
  getQuizScore,
  getQuizStatus,
  useAppSelector,
  useStoreActions,
} from "@/core/store";
import { QuickCheckFeedback } from "../components/QuickCheckFeedback";
import { QuickCheckHeader } from "../components/QuickCheckHeader";
import { QuickCheckIntro } from "../components/QuickCheckIntro";
import { QuickCheckQuestion } from "../components/QuickCheckQuestion";
import { QuickCheckScore } from "../components/QuickCheckScore";
import { useStudyRoute } from "../hooks/use-study-route";
import { useStepTransition } from "@/hooks/use-step-transition";
import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";
import { getQuickCheckAction, type QuickCheckAction } from "../logic/quick-check";
import { dayCompleteHref } from "../logic/routes";

/**
 * A day's Quick Check, from the store: its latest attempt, begun or resumed
 * on the question it's up to. One screen whose body cross-fades question to
 * question (`useStepTransition`), as the study does; the header and the
 * action stay put.
 *
 * Picking, checking, moving on, and finishing are the store's actions — and
 * the store decides what's allowed (one answer a question, no finishing with
 * one unanswered) and whether an answer is right (`getQuestionResult`). Once
 * checked, the verdict rises from the bottom with the way on. The finished
 * attempt shows its score, and shows it again whenever it's reopened.
 *
 * Pushed on top of Day Complete inside the Daily Study session. Close and
 * Done both return there.
 */
export function QuickCheckScreen() {
  const router = useRouter();
  const actions = useStoreActions();
  const { planId, dayNumber, day } = useStudyRoute();
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

  // Pages: the start (0), each question (1…n), then the score (n + 1).
  const currentIndex = questions.findIndex(
    (question) => question.id === attempt?.currentQuestionId,
  );
  const page =
    status === "notStarted" ? 0 : status === "completed" ? questions.length + 1 : currentIndex + 1;
  const reduceMotion = useReduceMotion();
  // Calm, like the study it follows.
  const { renderedStep: renderedPage, bodyStyle } = useStepTransition(page, {
    profile: "calm",
    reduceMotion,
  });

  if (!quiz || questions.length === 0) return null;

  const current = questions.at(currentIndex);
  const currentResult = results.at(currentIndex)?.result ?? "unanswered";
  const action = getQuickCheckAction({
    status,
    result: currentResult,
    hasSelection: Boolean(attempt?.selectedChoiceId),
    isLastQuestion: currentIndex === questions.length - 1,
  });

  function backToDayComplete() {
    router.dismissTo(dayCompleteHref(planId, dayNumber));
  }

  function act({ kind }: QuickCheckAction) {
    if (kind === "start") actions.startQuizAttempt(quizId);
    else if (kind === "check") actions.submitQuizAnswer(attemptId);
    else if (kind === "next") actions.moveToNextQuestion(attemptId);
    else if (kind === "finish") actions.completeQuizAttempt(attemptId);
    else backToDayComplete();
  }

  const shown = questions.at(renderedPage - 1);
  const shownAnswer = shown && answers.find((answer) => answer.questionId === shown.id);

  return (
    <Screen testID="quick-check-screen" padded>
      {status !== "completed" && (
        <QuickCheckHeader
          testID="quick-check"
          counter={Math.max(1, currentIndex + 1)}
          total={questions.length}
          progressIndex={Math.max(0, currentIndex)}
          onClose={backToDayComplete}
        />
      )}

      <Animated.View style={[styles.body, bodyStyle]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderedPage === 0 && (
            <QuickCheckIntro title={quiz.title} questionCount={questions.length} />
          )}
          {shown && (
            <QuickCheckQuestion
              question={shown}
              selectedChoiceId={
                shown.id === attempt?.currentQuestionId ? (attempt.selectedChoiceId ?? null) : null
              }
              answeredChoiceId={shownAnswer?.choiceId ?? null}
              onPick={(choiceId) => actions.selectQuizAnswer(attemptId, choiceId)}
            />
          )}
          {renderedPage > questions.length && score && (
            <QuickCheckScore score={score} results={results} />
          )}
        </ScrollView>
      </Animated.View>

      {current && currentResult !== "unanswered" && status === "inProgress" ? (
        <QuickCheckFeedback
          result={currentResult}
          question={current}
          action={action}
          onAction={() => act(action)}
        />
      ) : (
        <Button
          testID={action.testID}
          label={action.label}
          disabled={!action.enabled}
          onPress={() => act(action)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Fills the space between header and action, so the button stays anchored
  // at the bottom whatever the page's height.
  body: { flex: 1 },
});
