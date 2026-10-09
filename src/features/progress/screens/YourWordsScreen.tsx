import { useContext } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { ArrowLeft, Lock, Notebook, Shuffle } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { Button } from "@/ui/atoms/Button";
import { CompactButton } from "@/ui/atoms/CompactButton";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { ScreenHeader } from "@/ui/molecules/ScreenHeader";
import { Skeleton } from "@/ui/molecules/Skeleton";
import { SkeletonLines } from "@/ui/molecules/SkeletonLines";
import { getFootAboveTabBar } from "@/ui/organisms/frame-edges";
import { ScreenLoadError } from "@/ui/organisms/ScreenLoadError";
import { ScrollScreen } from "@/ui/organisms/ScrollScreen";
import { SFProBody } from "@/ui/typography/SFProBody";
import { ReflectionTimeline } from "../components/ReflectionTimeline";
import { ReflectionView } from "../components/ReflectionView";
import { WordsEmpty } from "../components/WordsEmpty";
import { useYourWords } from "../hooks/use-your-words";

/** The buttons end this far above the tab bar. */
const TAB_BAR_GAP = space[24];
/** The privacy line's lock: as small as its words. */
const LOCK = 14;

/**
 * Your words, from Progress: the reflections written on this phone, one at a
 * time — opened on an older one, to meet something forgotten. How many there
 * are, and that they never leave the phone; a timeline of them, scrubbed;
 * the one in view, scrolling on its own if it's long; and, pinned at the
 * foot, "Another one" and "Add a line today". No sharing, no export: they're
 * the phone's alone.
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
        <WordsEmpty title={view.empty.title} message={view.empty.message} />
      ) : (
        <>
          {/* The one in view scrolls on its own when it's long; everything else stays put. */}
          <ScrollView
            testID="your-words-scroll"
            style={styles.reflection}
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
                  question={view.shown.question}
                  answer={view.shown.answer}
                  reference={view.shown.reference}
                  lines={view.shown.lines}
                  writing={
                    view.writing
                      ? { text: view.todayLine, onChange: view.changeLine, onEnd: view.endLine }
                      : null
                  }
                  onOpenStudy={view.openStudy}
                />
              )
            )}
          </ScrollView>
        </>
      )}

      {view.shown && (
        <View style={[styles.actions, { gap: space[16], paddingTop: space[12] }]}>
          {view.canShowAnother ? (
            <CompactButton
              testID="your-words-another"
              label="Another one"
              icon={Shuffle}
              tone="soft"
              align="start"
              onPress={view.showAnother}
            />
          ) : (
            <View />
          )}
          <View style={styles.addLine}>
            <Button
              testID="your-words-add-line"
              label="Add a line today"
              variant="secondary"
              onPress={view.startLine}
            />
          </View>
        </View>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  kept: { flexDirection: "row", alignItems: "center" },
  hint: { paddingTop: space[4] },
  timeline: { paddingTop: space[24], paddingBottom: space[28] },
  reflection: { flex: 1 },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  addLine: { flexShrink: 0 },
});
