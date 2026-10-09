import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { X } from "lucide-react-native";

import { MilestoneScreen } from "@/ui/organisms/MilestoneScreen";
import { SkeletonHandoff } from "@/ui/molecules/SkeletonHandoff";
import { ScrollScreen } from "@/ui/organisms/ScrollScreen";
import { QuickCheckSkeleton } from "../components/QuickCheckSkeleton";
import { ScreenHeader } from "@/ui/molecules/ScreenHeader";
import { Button } from "@/ui/atoms/Button";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { StepProgress } from "@/ui/atoms/StepProgress";
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
import { space } from "@/theme";

export function QuickCheckScreen() {
  const view = useQuickCheckSession();
  const reduceMotion = useReduceMotion();

  const { renderedStep: renderedPage, bodyStyle } = useStepTransition(view.page, {
    profile: "calm",
    reduceMotion,
  });

  // While the quiz loads, its skeleton; then whatever came — handed over without a snap.
  return (
    <SkeletonHandoff
      testID="quick-check-handoff"
      fill
      pending={view.loading}
      skeleton={
        <ScrollScreen
          testID="quick-check-screen"
          header={
            <ScreenHeader
              testID="quick-check-loading-header"
              title="Quick check"
              left={
                <HeaderIconButton
                  testID="quick-check-loading-close-button"
                  icon={X}
                  accessibilityLabel="Close"
                  onPress={view.close}
                />
              }
            />
          }
          contentStyle={styles.loadingContent}
        >
          <QuickCheckSkeleton testID="quick-check-content-pending" />
        </ScrollScreen>
      }
    >
      {renderPage()}
    </SkeletonHandoff>
  );

  function renderPage() {
    if (view.loading) return null;

    if (!view.found) {
      return (
        <StudyNotFound testID="quick-check-not-found" error={view.error} onRetry={view.retry} />
      );
    }

    const { questions, status, currentIndex, current, currentResult, action, score } = view;

    const actionButton = (
      <Button
        testID={action.testID}
        label={action.label}
        disabled={view.busy || !action.enabled}
        onPress={() => void view.act(action)}
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
          // The Study's steps: Read, Scripture, Reflect, and Pray done — the Quick Check next.
          mark={
            <View testID="quick-check-intro" style={styles.steps}>
              <StepProgress steps={STUDY_AND_CHECK} activeIndex={STUDY_AND_CHECK - 1} />
            </View>
          }
          title="Today's study is done."
          subtitle={describeQuickCheckIntro(view.questionCount, view.firstTime)}
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
          <QuickCheckResults testID="quick-check-results" items={view.review} />
        </MilestoneScreen>
      );
    }

    const shown = renderedPage > 0 ? questions.at(renderedPage - 1) : undefined;

    const shownAnswer = shown && view.answers.find((answer) => answer.questionId === shown.id);

    return (
      <ScrollScreen
        testID="quick-check-screen"
        header={
          <QuickCheckHeader
            testID="quick-check"
            total={questions.length}
            progress={{
              counter: currentIndex + 1,
              index: currentIndex,
            }}
            onClose={view.close}
          />
        }
        footer={actionButton}
        {...(current &&
          currentResult !== "unanswered" && {
            feedback: (
              <QuickCheckFeedback
                result={currentResult}
                question={current}
                action={action}
                busy={view.busy}
                onAction={() => void view.act(action)}
              />
            ),
          })}
      >
        <Animated.View style={bodyStyle}>
          {shown && (
            <QuickCheckQuestion
              question={shown}
              selectedChoiceId={view.selectedFor(shown.id)}
              answeredChoiceId={shownAnswer?.choiceId ?? null}
              onPick={view.pick}
            />
          )}
        </Animated.View>
      </ScrollScreen>
    );
  }
}

/** The Study's four steps and the Quick Check after them. */
const STUDY_AND_CHECK = 5;
/** The steps' width as the page's mark: wide enough to read as the Study's bar. */
const STEPS_WIDTH = 200;

const styles = StyleSheet.create({
  steps: { width: STEPS_WIDTH },
  loadingContent: {
    paddingTop: space[24],
  },
});
