import { useState } from "react";
import { StatusBar, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { X } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { ScreenHeader } from "@/ui/molecules/ScreenHeader";
import { StudySkeleton } from "../components/StudySkeleton";
import { ScrollScreen } from "@/ui/organisms/ScrollScreen";
import { TextSizeScope } from "@/ui/typography/TextSizeScope";
import { ReadingSheet } from "../components/ReadingSheet";
import { StudyHeader } from "../components/StudyHeader";
import { StudyNotFound } from "../components/StudyNotFound";
import { useStudySession } from "../hooks/use-study-session";
import { StudyNav } from "../components/StudyNav";
import { StudyStepBody } from "../components/StudyStepBody";
import { StudyDriftProvider } from "../components/StudyDriftIn";
import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";
import { useStepTransition } from "@/hooks/use-step-transition";
import { useModalSession } from "@/hooks/use-modal-session";
import { STUDY_STEPS, fromPageIndex, toPageIndex } from "../logic/study-steps";
import { ThemeScope, getReadingTheme, space } from "@/theme";

export function StudyScreen() {
  const view = useStudySession();
  const modal = useModalSession();
  const [readingOpen, setReadingOpen] = useState(false);
  const reduceMotion = useReduceMotion();

  const {
    renderedStep: renderedPage,
    bodyStyle,
    followStyle,
  } = useStepTransition(toPageIndex(view.position, view.pages), {
    profile: "drift",
    reduceMotion,
  });

  if (!view.found && view.loading) {
    return (
      <ScrollScreen
        testID="study-screen"
        header={
          <ScreenHeader
            testID="study-loading-header"
            title="Daily study"
            left={
              <HeaderIconButton
                testID="study-loading-close-button"
                icon={X}
                accessibilityLabel="Close"
                onPress={modal.exit}
              />
            }
          />
        }
        contentStyle={styles.loadingContent}
      >
        <StudySkeleton testID="study-content-pending" />
      </ScrollScreen>
    );
  }

  if (!view.found) {
    return <StudyNotFound testID="study-not-found" error={view.error} onRetry={view.retry} />;
  }

  const rendered = fromPageIndex(renderedPage, view.pages);

  const bodyStep = STUDY_STEPS.at(rendered.step) ?? STUDY_STEPS[0];

  const { reading } = view;
  const paper = getReadingTheme(reading.paper);

  return (
    <>
      <ThemeScope theme={paper}>
        <ScrollScreen
          testID="study-screen"
          headerFade="gradual"
          header={
            <StudyHeader
              testID="study"
              day={view.dayNumber}
              totalDays={view.totalDays}
              step={view.position.step}
              pages={view.pages}
              page={view.position.page}
              onClose={view.close}
              onTextSize={() => setReadingOpen(true)}
            />
          }
          footer={
            <StudyNav
              testID="study-nav"
              {...(view.isLastPage && {
                finishLabel: "Finish",
              })}
              onPrevious={view.previous}
              onNext={view.next}
              disabled={view.busy}
            />
          }
          contentStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <Animated.View style={bodyStyle}>
            <TextSizeScope offset={reading.textOffset}>
              <StudyDriftProvider revealKey={renderedPage} still={reduceMotion}>
                <StudyStepBody
                  stepKey={bodyStep.key}
                  page={rendered.page}
                  content={view.content}
                  answerFor={view.answerFor}
                  onAnswerChange={view.changeAnswer}
                  followStyle={followStyle}
                />
              </StudyDriftProvider>
            </TextSizeScope>
          </Animated.View>
        </ScrollScreen>
      </ThemeScope>

      <ReadingSheet
        visible={readingOpen}
        onClose={() => setReadingOpen(false)}
        textOffset={reading.textOffset}
        onTextOffsetChange={reading.setTextOffset}
        paper={reading.paper}
        onPaperChange={reading.setPaper}
      />

      {paper.name === "dark" && <StatusBar animated barStyle="light-content" />}
    </>
  );
}

const styles = StyleSheet.create({
  bodyContent: {
    paddingBottom: space[24],
  },

  loadingContent: {
    paddingTop: space[24],
  },
});
