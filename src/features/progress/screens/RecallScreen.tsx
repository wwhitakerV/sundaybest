import { useContext } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { ArrowLeft, ListChecks } from "lucide-react-native";

import { radius, space } from "@/theme";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { RoundedEdge } from "@/ui/atoms/RoundedEdge";
import { ScreenHeader } from "@/ui/molecules/ScreenHeader";
import { Skeleton } from "@/ui/molecules/Skeleton";
import { SkeletonLines } from "@/ui/molecules/SkeletonLines";
import { getFootAboveTabBar } from "@/ui/organisms/frame-edges";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { ScreenLoadError } from "@/ui/organisms/ScreenLoadError";
import { ScrollScreen } from "@/ui/organisms/ScrollScreen";
import { SFProBody } from "@/ui/typography/SFProBody";
import { MissedQuestionView } from "../components/MissedQuestionView";
import { ProgressEmpty } from "../components/ProgressEmpty";
import { RecallKey } from "../components/RecallKey";
import { RecallGrid } from "../components/RecallGrid";
import { useRecall } from "../hooks/use-recall";

/** The buttons end this far above the tab bar. */
const TAB_BAR_GAP = space[24];
/** The question's card's corner, which the scroll rounds into at its top. */
const CARD_RADIUS = radius[24];

/**
 * Quick Check, from Progress: what the reader remembers. How much, across
 * how many; each Quick Check a capsule, a segment a question, green where
 * correct, amber where missed; and the ones missed, one at a time with the
 * right answer, moved between by their segments. A button in the header zooms out the list of every
 * Quick Check, each opening its results — where it's taken again.
 */
export function RecallScreen() {
  const view = useRecall();
  const insetBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;

  if (view.error) {
    return (
      <ScreenLoadError
        testID="recall-load-error"
        title="Couldn't load Quick Checks"
        onRetry={view.retry}
      />
    );
  }

  return (
    <ScrollScreen
      testID="recall-screen"
      fixed
      contentStyle={{ paddingBottom: getFootAboveTabBar(insetBottom, TAB_BAR_GAP) }}
      header={
        <ScreenHeader
          testID="recall-header"
          title="Quick Check"
          left={
            <HeaderIconButton
              testID="recall-back-button"
              icon={ArrowLeft}
              accessibilityLabel="Back"
              onPress={view.back}
            />
          }
          {...(view.listHref && {
            right: (
              // Every Quick Check zooms out of this, and back into it (iOS 18's zoom).
              <Link href={view.listHref} asChild>
                <Link.AppleZoom>
                  <HeaderIconButton
                    testID="recall-list-button"
                    icon={ListChecks}
                    accessibilityLabel="Every Quick Check"
                    onPress={view.openList}
                  />
                </Link.AppleZoom>
              </Link>
            ),
          })}
        />
      }
    >
      {view.empty ? (
        <ProgressEmpty
          testID="recall-empty"
          icon={ListChecks}
          title={view.empty.title}
          message={view.empty.message}
        />
      ) : (
        <>
          {/* The grid's key and counts — green correct, amber to revisit, the caret shown below — then how to use it. */}
          {view.loading ? (
            <SFProBody variant="rowDetail"> </SFProBody>
          ) : (
            <RecallKey
              correct={view.counts.correct}
              toRevisit={view.counts.toRevisit}
              showing={view.shown !== null}
            />
          )}
          {view.mosaicHint && (
            <SFProBody variant="rowDetail" tone="textSupporting" style={styles.hint}>
              {view.mosaicHint}
            </SFProBody>
          )}
          {view.blocks.length > 0 && (
            <View style={[styles.mosaic, { gap: space[12] }]}>
              {/* Each day's Quick Check, newest on the left; drag left to go further back. */}
              <View style={styles.bleed}>
                <RecallGrid
                  testID="recall-grid"
                  blocks={view.blocks}
                  shownId={view.shown?.id ?? null}
                  onShow={view.showQuestion}
                  onDragging={view.holdBackSwipe}
                />
              </View>
            </View>
          )}

          {/* The one in view scrolls on its own when it's long; everything else stays put. */}
          <View style={styles.missed}>
            <ScrollView
              testID="recall-scroll"
              style={styles.scroll}
              contentContainerStyle={{ paddingBottom: space[24] }}
              showsVerticalScrollIndicator={false}
            >
              {view.loading ? (
                <Skeleton testID="recall-pending" style={{ gap: space[24] }}>
                  <SkeletonLines count={2} />
                  <SkeletonLines count={3} />
                </Skeleton>
              ) : view.nothingMissed ? (
                <SFProBody testID="recall-nothing-missed" variant="reading" tone="textInactive">
                  {view.nothingMissed}
                </SFProBody>
              ) : (
                view.shown && (
                  // A new question, a new view: it arrives with its own entrance.
                  <MissedQuestionView
                    key={view.shown.id}
                    place={view.place}
                    planTitle={view.shown.planTitle}
                    thumbnailUrl={view.shown.thumbnailUrl}
                    prompt={view.shown.prompt}
                    chosen={view.shown.chosen}
                    correct={view.shown.correct}
                    scripture={view.shown.scripture}
                    answer={view.shown.answer}
                    studyLabel={view.studyLabel}
                    onOpenStudy={view.openStudy}
                    onRetake={() => void view.takeAgain()}
                    retaking={view.retaking}
                  />
                )
              )}
            </ScrollView>
            {/* A long card scrolls up into a rounded edge, as Your words' and The Word's do. */}
            <RoundedEdge radius={CARD_RADIUS} inset={0} top={0} />
          </View>
        </>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  // The caret's room over the capsules is part of the gap above them, so the grid stays put.
  mosaic: { paddingTop: space[16], paddingBottom: space[28] },
  // The rest of the page: the question scrolls within it.
  missed: { flex: 1 },
  scroll: { flex: 1 },
  hint: { paddingTop: space[8] },
  // The row runs to the screen's edges, where its fades say there's more.
  bleed: { marginHorizontal: -PAGE_INSET },
});
