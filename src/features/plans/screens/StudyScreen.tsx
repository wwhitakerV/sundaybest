import { useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { X } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { ScreenHeader } from "@/ui/molecules/ScreenHeader";
import { SkeletonHandoff } from "@/ui/molecules/SkeletonHandoff";
import { StudySkeleton } from "../components/StudySkeleton";
import { ScrollScreen } from "@/ui/organisms/ScrollScreen";
import { TextSizeScope } from "@/ui/typography/TextSizeScope";
import { ReadingSheet } from "../components/ReadingSheet";
import { StudyHeader } from "../components/StudyHeader";
import { StudyNotFound } from "../components/StudyNotFound";
import { useStudySession } from "../hooks/use-study-session";
import { StudyNav } from "../components/StudyNav";
import { StudyStepBody } from "../components/StudyStepBody";
import { StudyEnterProvider } from "../components/StudyEnter";
import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";
import { useModalSession } from "@/hooks/use-modal-session";
import { STUDY_STEPS, toPageIndex } from "../logic/study-steps";
import { ThemeScope, getReadingTheme, space } from "@/theme";

type StudySession = ReturnType<typeof useStudySession>;
type FoundStudy = Extract<StudySession, { found: true }>;

/**
 * The Daily Study. While the day loads it shows its skeleton, which hands
 * over to the page without a snap (`SkeletonHandoff`).
 */
export function StudyScreen() {
  const view = useStudySession();
  const modal = useModalSession();

  return (
    <SkeletonHandoff
      testID="study-handoff"
      fill
      pending={!view.found && view.loading}
      skeleton={<StudyPending onClose={modal.exit} />}
    >
      {view.found ? (
        <StudyPage view={view} />
      ) : (
        <StudyNotFound testID="study-not-found" error={view.error} onRetry={view.retry} />
      )}
    </SkeletonHandoff>
  );
}

/** The day on its way: its header and its skeleton. */
function StudyPending({ onClose }: { onClose: () => void }) {
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
              onPress={onClose}
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

/**
 * The day's study, a page at a time. Each page is keyed by where it falls in
 * the day, so every page — every step, every question — mounts fresh and its
 * parts enter in turn (`StudyEnter`): fading in as they move left into place.
 */
function StudyPage({ view }: { view: FoundStudy }) {
  const [readingOpen, setReadingOpen] = useState(false);
  const reduceMotion = useReduceMotion();

  const pageIndex = toPageIndex(view.position, view.pages);
  const step = STUDY_STEPS.at(view.position.step) ?? STUDY_STEPS[0];
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
          <TextSizeScope offset={reading.textOffset}>
            <StudyEnterProvider still={reduceMotion}>
              <View key={pageIndex} testID={`study-page-${pageIndex}`}>
                <StudyStepBody
                  stepKey={step.key}
                  page={view.position.page}
                  content={view.content}
                  answerFor={view.answerFor}
                  onAnswerChange={view.changeAnswer}
                />
              </View>
            </StudyEnterProvider>
          </TextSizeScope>
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
