import { useContext } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { ArrowLeft, Lock, Notebook, NotebookPen } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { RoundedEdge } from "@/ui/atoms/RoundedEdge";
import { ScreenHeader } from "@/ui/molecules/ScreenHeader";
import { Skeleton } from "@/ui/molecules/Skeleton";
import { SkeletonLines } from "@/ui/molecules/SkeletonLines";
import { getFootAboveTabBar } from "@/ui/organisms/frame-edges";
import { ScreenLoadError } from "@/ui/organisms/ScreenLoadError";
import { ScrollScreen } from "@/ui/organisms/ScrollScreen";
import { SFProBody } from "@/ui/typography/SFProBody";
import { ReflectionTimeline } from "../components/ReflectionTimeline";
import { ReflectionSheet } from "../components/ReflectionSheet";
import { ReflectionView } from "../components/ReflectionView";
import { ProgressEmpty } from "../components/ProgressEmpty";
import { useYourWords } from "../hooks/use-your-words";

/** The page ends this far above the tab bar. */
const TAB_BAR_GAP = space[24];
/** The reflection's card's corner, which the scroll rounds into at its top. */
const CARD_RADIUS = radius[24];
/** The privacy line's lock: as small as its words. */
const LOCK = 14;

/**
 * Your words, from Progress: the reflections written on this phone, one at a
 * time — opened on an older one, to meet something forgotten. How many there
 * are, and that they never leave the phone; a timeline of them, scrubbed;
 * and the one in view, scrolling on its own if it's long, its pencil adding
 * to it on a sheet. No sharing, no export: they're the phone's alone.
 */
export function YourWordsScreen() {
  const theme = useTheme();
  const view = useYourWords();
  const insetBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;

  if (view.error) {
    return (
      <ScreenLoadError
        testID="your-words-load-error"
        title="Couldn't load your words"
        onRetry={view.retry}
        leave={{ label: "Back", onPress: view.back }}
      />
    );
  }

  return (
    <ScrollScreen
      testID="your-words-screen"
      fixed
      // The add-to-reflection sheet sits inside this page as far as taps go: with the keyboard up,
      // its X and Done must take the first tap, not spend it putting the keyboard away.
      keyboardShouldPersistTaps="handled"
      contentStyle={{ paddingBottom: getFootAboveTabBar(insetBottom, TAB_BAR_GAP) }}
      header={
        <ScreenHeader
          testID="your-words-header"
          title="Your words"
          left={
            <HeaderIconButton
              testID="your-words-back-button"
              icon={ArrowLeft}
              accessibilityLabel="Back"
              onPress={view.back}
            />
          }
          {...(view.listHref && {
            right: (
              // Every reflection zooms out of the notebook, and back into it (iOS 18's zoom).
              // `asChild`: the link hands its press to the button, which the zoom grows from.
              <Link href={view.listHref} asChild>
                <Link.AppleZoom>
                  <HeaderIconButton
                    testID="your-words-list-button"
                    icon={Notebook}
                    accessibilityLabel="All your reflections"
                    onPress={view.openList}
                  />
                </Link.AppleZoom>
              </Link>
            ),
          })}
        />
      }
    >
      <View style={[styles.kept, { gap: space[6] }]}>
        <Lock
          size={LOCK}
          color={theme.colors.textSupporting}
          strokeWidth={theme.icon.strokeWidth}
        />
        <SFProBody variant="rowDetail" tone="textSupporting">
          {view.loading ? " " : view.kept}
        </SFProBody>
      </View>

      {view.ends && view.marks > 0 && (
        <SFProBody variant="rowDetail" tone="textSupporting" style={styles.hint}>
          {view.timelineHint}
        </SFProBody>
      )}
      {view.ends && view.marks > 0 && (
        <View style={styles.timeline}>
          <ReflectionTimeline
            testID="your-words-timeline"
            count={view.marks}
            shown={view.markShown}
            ends={view.ends}
            onShow={view.showMark}
            onTouching={view.holdBackSwipe}
          />
        </View>
      )}

      {view.empty ? (
        <ProgressEmpty
          testID="your-words-empty"
          icon={NotebookPen}
          title={view.empty.title}
          message={view.empty.message}
        />
      ) : (
        <>
          {/* The one in view scrolls on its own when it's long; everything else stays put. */}
          <View style={styles.reflection}>
            <ScrollView
              testID="your-words-scroll"
              style={styles.scroll}
              contentContainerStyle={{ paddingBottom: space[24] }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              automaticallyAdjustKeyboardInsets
            >
              {view.loading ? (
                <Skeleton testID="your-words-pending" style={{ gap: space[24] }}>
                  <SkeletonLines count={2} />
                  <SkeletonLines count={4} />
                </Skeleton>
              ) : (
                view.shown && (
                  // A new reflection, a new view: it arrives with its own entrance.
                  <ReflectionView
                    key={view.shown.id}
                    ago={view.shown.ago}
                    date={view.shown.date}
                    planTitle={view.shown.planTitle}
                    thumbnailUrl={view.shown.thumbnailUrl}
                    question={view.shown.question}
                    answer={view.shown.answer}
                    studyLabel={view.shown.studyLabel}
                    lines={view.shown.lines}
                    onEdit={view.startLine}
                    onOpenStudy={view.openStudy}
                  />
                )
              )}
            </ScrollView>
            {/* A long card scrolls up into a rounded edge, as The Word's do — never a straight cut. */}
            <RoundedEdge radius={CARD_RADIUS} inset={0} top={0} />
          </View>
        </>
      )}

      {view.shown && (
        // Adding to the one in view: it read back, and a place for today's update.
        <ReflectionSheet
          visible={view.writing}
          date={view.shown.date}
          question={view.shown.question}
          answer={view.shown.answer}
          lines={view.shown.earlierLines}
          text={view.todayLine}
          onChange={view.changeLine}
          onClose={view.endLine}
        />
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  kept: { flexDirection: "row", alignItems: "center" },
  hint: { paddingTop: space[4] },
  timeline: { paddingTop: space[24], paddingBottom: space[28] },
  // The rest of the page: the reflection scrolls within it.
  reflection: { flex: 1 },
  scroll: { flex: 1 },
});
