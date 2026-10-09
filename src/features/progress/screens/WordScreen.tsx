import { useContext } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { ArrowLeft, ChartNoAxesColumn } from "lucide-react-native";

import { radius, space } from "@/theme";
import { Collapse } from "@/ui/atoms/Collapse";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { RoundedEdge } from "@/ui/atoms/RoundedEdge";
import { Swap } from "@/ui/atoms/Swap";
import { Toggle } from "@/ui/atoms/Toggle";
import { FilterPills } from "@/ui/molecules/FilterPills";
import { ScreenHeader } from "@/ui/molecules/ScreenHeader";
import { Skeleton } from "@/ui/molecules/Skeleton";
import { SkeletonLines } from "@/ui/molecules/SkeletonLines";
import { getFootAboveTabBar } from "@/ui/organisms/frame-edges";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { ScreenLoadError } from "@/ui/organisms/ScreenLoadError";
import { ScrollScreen } from "@/ui/organisms/ScrollScreen";
import { SFProBody } from "@/ui/typography/SFProBody";
import { BibleMap } from "../components/BibleMap";
import { WordPassageList } from "../components/WordPassageList";
import { useWordView } from "../hooks/use-word-view";

/** The last passage ends this far above the tab bar. */
const TAB_BAR_GAP = space[24];
/** The passages' card's corner, which the list rounds into at its top. */
const CARD_RADIUS = radius[24];

/**
 * The Word, from Progress: the whole Bible as lines, dark where the reader
 * has been; the books studied as chips; and the book picked's passages. The
 * page fits the screen: the map and chips stay put, and only the list
 * scrolls, rounding into its top edge. A switch in the header puts the chart
 * away for more room to read — it rolls up, and what's below moves up.
 */
export function WordScreen() {
  const view = useWordView();
  const insetBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;

  if (view.error) {
    return (
      <ScreenLoadError
        testID="word-load-error"
        title="Couldn't load The Word"
        onRetry={view.retry}
        leave={{ label: "Back", onPress: view.back }}
      />
    );
  }

  return (
    <ScrollScreen
      testID="word-screen"
      fixed
      header={
        <ScreenHeader
          testID="word-header"
          title="The Word"
          left={
            <HeaderIconButton
              testID="word-back-button"
              icon={ArrowLeft}
              accessibilityLabel="Back"
              onPress={view.back}
            />
          }
          right={
            <Toggle
              testID="word-chart-toggle"
              accessibilityLabel="Chart"
              icon={ChartNoAxesColumn}
              value={view.chartShown}
              onValueChange={view.showChart}
            />
          }
        />
      }
    >
      {/*
        One line that never moves: its words change in place as the chart is shown or put away.
        Without the chart, the room below it is its own — the same room the chart leaves.
      */}
      <Swap
        testID="word-description"
        showSecond={!view.chartShown}
        first={
          <SFProBody variant="rowDetail" tone="textSupporting">
            {view.withChart}
          </SFProBody>
        }
        second={
          <View style={styles.alone}>
            <SFProBody variant="rowDetail" tone="textSupporting">
              {view.withoutChart}
            </SFProBody>
          </View>
        }
      />
      {/* Only the chart rolls, under the line. */}
      <Collapse testID="word-chart" open={view.chartShown}>
        <View style={styles.map}>
          <BibleMap
            testID="word-map"
            lines={view.lines}
            selected={view.selected}
            onSelect={view.select}
            onTouching={view.holdBackSwipe}
          />
        </View>
      </Collapse>
      {view.chips.length > 0 && (
        <FilterPills
          testID="word-books"
          tight
          options={view.chips}
          selected={view.selected}
          onSelect={view.select}
          bleed={PAGE_INSET}
        />
      )}

      <View style={styles.list}>
        <ScrollView
          testID="word-list"
          style={styles.scroll}
          contentContainerStyle={{
            paddingBottom: getFootAboveTabBar(insetBottom, TAB_BAR_GAP),
          }}
          showsVerticalScrollIndicator={false}
        >
          {view.loading ? (
            <Skeleton testID="word-pending" style={{ gap: space[24] }}>
              <SkeletonLines count={2} />
              <SkeletonLines count={2} />
              <SkeletonLines count={2} />
            </Skeleton>
          ) : view.empty ? (
            <SFProBody testID="word-empty" variant="reading" tone="textInactive">
              {view.empty}
            </SFProBody>
          ) : (
            // A new book, a new list: it arrives with its own entrance.
            <WordPassageList key={view.selected ?? ""} rows={view.rows} />
          )}
        </ScrollView>
        {/* The card scrolls up into a rounded edge, never a straight cut. */}
        <RoundedEdge radius={CARD_RADIUS} inset={0} top={0} />
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  alone: { paddingBottom: space[22] },
  map: { paddingTop: space[28], paddingBottom: space[22] },
  // The rest of the page, under the pills: the list scrolls within it.
  list: { flex: 1, marginTop: space[16] },
  scroll: { flex: 1 },
});
