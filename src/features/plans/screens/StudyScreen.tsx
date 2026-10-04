import { useState } from "react";
import { StatusBar, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";

import { ScrollScreen } from "@/ui/organisms/ScrollScreen";
import { TextSizeScope } from "@/ui/typography/TextSizeScope";
import { FLOATING_NAV_BAR_CLEARANCE } from "@/ui/organisms/floatingNavBar";
import { ReadingSheet } from "../components/ReadingSheet";
import { StudyHeader } from "../components/StudyHeader";
import { StudyNotFound } from "../components/StudyNotFound";
import { useStudySession } from "../hooks/use-study-session";
import { StudyNav } from "../components/StudyNav";
import { StudyStepBody } from "../components/StudyStepBody";
import { StudyDriftProvider } from "../components/StudyDriftIn";
import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";
import { useStepTransition } from "@/hooks/use-step-transition";
import { STUDY_STEPS, fromPageIndex, toPageIndex } from "../logic/study-steps";
import { ThemeScope, getReadingTheme, space } from "@/theme";

/**
 * Read, Scripture, Reflect, and Pray as one screen with internal step state.
 * A route per step would unmount the header, tracker, and nav on every
 * change (that was the old horizontal push); here they stay put and only
 * the body cross-fades (`useStepTransition`), calmly — each page's title,
 * then its content a beat later — since this is for reading.
 *
 * The first screen of the Daily Study session modal (`src/app/study`). What
 * it shows and what moving does: `useStudySession`.
 */
export function StudyScreen() {
  const view = useStudySession();
  // Whether the reading sheet is up: the screen's own, passing state.
  const [readingOpen, setReadingOpen] = useState(false);
  const reduceMotion = useReduceMotion();
  // Pages cross-fade like steps: the transition follows one running page
  // number. Calm, for reading — each page's title, then the rest a beat later.
  const {
    renderedStep: renderedPage,
    bodyStyle,
    followStyle,
  } = useStepTransition(toPageIndex(view.position, view.pages), { profile: "drift", reduceMotion });

  if (!view.found) {
    return <StudyNotFound testID="study-not-found" />;
  }

  const rendered = fromPageIndex(renderedPage, view.pages);
  const bodyStep = STUDY_STEPS.at(rendered.step) ?? STUDY_STEPS[0];
  const { reading } = view;
  const paper = getReadingTheme(reading.paper);

  return (
    <>
      {/* The page, on its paper. The sheet stays in the app's own colours. */}
      <ThemeScope theme={paper}>
        {/* A day's reading runs longer than the screen; the keyboard lifts the answer boxes. */}
        <ScrollScreen
          testID="study-screen"
          style={styles.clearBottomNav}
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
          overlay={
            // Floats over the foot of the page, clear of the reading (`clearBottomNav`).
            <StudyNav
              testID="study-nav"
              step={view.position.step}
              {...(view.isLastPage && { finishLabel: "Finish" })}
              onPrevious={view.previous}
              onNext={view.next}
            />
          }
          contentStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <Animated.View style={bodyStyle}>
            {/* The reading's own size; the header and nav stay as they are. */}
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
      {/* Light status bar text over a dark paper. */}
      {paper.name === "dark" && <StatusBar animated barStyle="light-content" />}
    </>
  );
}

const styles = StyleSheet.create({
  clearBottomNav: { paddingBottom: FLOATING_NAV_BAR_CLEARANCE },
  bodyContent: { paddingBottom: space[24] },
});
