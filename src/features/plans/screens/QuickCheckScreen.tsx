import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { ListChecks, X } from "lucide-react-native";

import { MilestoneScreen } from "@/ui/organisms/MilestoneScreen";
import { ScrollScreen } from "@/ui/organisms/ScrollScreen";
import { QuickCheckSkeleton } from "../components/QuickCheckSkeleton";
import { ScreenHeader } from "@/ui/molecules/ScreenHeader";
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
import { space } from "@/theme";

export function QuickCheckScreen() {
  const view = useQuickCheckSession();
  const reduceMotion = useReduceMotion();

  const { renderedStep: renderedPage, bodyStyle } = useStepTransition(view.page, {
    profile: "calm",
    reduceMotion,
  });

  if (view.loading) {
    return (
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
    );
  }

  if (!view.found) {
    return <StudyNotFound testID="quick-check-not-found" error={view.error} onRetry={view.retry} />;
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
        mark={<IconRing testID="quick-check-intro" icon={ListChecks} />}
        title={`Day ${view.dayNumber} Quiz`}
        subtitle={describeQuickCheckIntro(view.questionCount)}
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

const styles = StyleSheet.create({
  loadingContent: {
    paddingTop: space[24],
  },
});
