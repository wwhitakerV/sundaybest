import { ScrollView, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { ListChecks, X } from "lucide-react-native";

import { MilestoneScreen } from "@/ui/organisms/MilestoneScreen";
import { Screen } from "@/ui/organisms/Screen";
import { Button } from "@/ui/atoms/Button";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { IconRing } from "@/ui/atoms/IconRing";
import { ProgressRing } from "@/ui/atoms/ProgressRing";
import { QuickCheckFeedback } from "../components/QuickCheckFeedback";
import { QuickCheckHeader } from "../components/QuickCheckHeader";
import { QuickCheckQuestion } from "../components/QuickCheckQuestion";
import { QuickCheckResults } from "../components/QuickCheckResults";
import { StudyNotFound } from "../components/StudyNotFound";
import { useQuickCheckSession } from "../hooks/use-quick-check-session";
import { describeQuickCheckIntro, getScoreHeadline } from "../logic/quick-check";
import { useStepTransition } from "@/hooks/use-step-transition";
import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";

/**
 * A day's Quick Check. Its start and its results are milestone pages
 * (`MilestoneScreen`): the start just the day's quiz and Start, with a close
 * and no title; the results its score, how it went, and each question. In
 * between, one screen whose body cross-fades question to question
 * (`useStepTransition`), as the study does; the header and the action stay
 * put, and once checked the verdict rises from the bottom with the way on.
 *
 * What it shows and what each action does: `useQuickCheckSession`.
 */
export function QuickCheckScreen() {
  const view = useQuickCheckSession();
  const reduceMotion = useReduceMotion();
  // Calm, like the study it follows.
  const { renderedStep: renderedPage, bodyStyle } = useStepTransition(view.page, {
    profile: "calm",
    reduceMotion,
  });

  if (!view.found) return <StudyNotFound testID="quick-check-not-found" />;
  const { questions, attempt, status, currentIndex, current, currentResult, action, score } = view;
  const actionButton = (
    <Button
      testID={action.testID}
      label={action.label}
      disabled={!action.enabled}
      onPress={() => view.act(action)}
    />
  );

  if (status === "notStarted") {
    return (
      <MilestoneScreen
        testID="quick-check-screen"
        header={
          <HeaderIconButton
            testID="quick-check-close-button"
            icon={X}
            accessibilityLabel="Close"
            onPress={view.close}
          />
        }
        mark={<IconRing testID="quick-check-intro" icon={ListChecks} />}
        title={`Day ${view.dayNumber} Quiz`}
        subtitle={describeQuickCheckIntro(questions.length)}
        footer={actionButton}
      />
    );
  }

  if (status === "completed" && score) {
    return (
      <MilestoneScreen
        testID="quick-check-screen"
        mark={
          <ProgressRing
            testID="quick-check-score-ring"
            percent={score.percentage}
            label={`${score.correct}/${score.total}`}
          />
        }
        title={getScoreHeadline(score)}
        subtitle={`${score.percentage}% right`}
        footer={actionButton}
      >
        <QuickCheckResults results={view.results} />
      </MilestoneScreen>
    );
  }

  // A question's page — none while the start is still fading out.
  const shown = renderedPage > 0 ? questions.at(renderedPage - 1) : undefined;
  const shownAnswer = shown && view.answers.find((answer) => answer.questionId === shown.id);

  return (
    <Screen testID="quick-check-screen" padded>
      <QuickCheckHeader
        testID="quick-check"
        total={questions.length}
        progress={{ counter: currentIndex + 1, index: currentIndex }}
        onClose={view.close}
      />

      <Animated.View style={[styles.body, bodyStyle]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {shown && (
            <QuickCheckQuestion
              question={shown}
              selectedChoiceId={
                shown.id === attempt?.currentQuestionId ? (attempt.selectedChoiceId ?? null) : null
              }
              answeredChoiceId={shownAnswer?.choiceId ?? null}
              onPick={view.pick}
            />
          )}
        </ScrollView>
      </Animated.View>

      {current && currentResult !== "unanswered" ? (
        <QuickCheckFeedback
          result={currentResult}
          question={current}
          action={action}
          onAction={() => view.act(action)}
        />
      ) : (
        actionButton
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Fills the space between header and action, so the button stays anchored
  // at the bottom whatever the page's height.
  body: { flex: 1 },
});
