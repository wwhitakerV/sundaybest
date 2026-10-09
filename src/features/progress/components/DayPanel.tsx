import { useRef } from "react";
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";

import type { ApiWeekPassage } from "@/core/api/contracts";
import { space } from "@/theme";
import { StepProgress } from "@/ui/atoms/StepProgress";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import type { PanelLook } from "../logic/week-view";
import { PassagePage } from "./PassagePage";

/** Each passage's share of the Study's bars: the set widens with the day's passages, up to its most. */
const BAR_SHARE = 22;
const BARS_MOST_WIDTH = 176;

export type DayPanelProps = {
  /** The day picked, which the panel is keyed to: picking another starts it afresh. */
  date: string;
  /** "Today", or the day's name. */
  label: string;
  isToday: boolean;
  /** The reader's Bible translation: "BSB". */
  translation: string;
  /** The day's passages, each with what the panel says for it; one page, with no passage, on a day with none. */
  pages: readonly { passage: ApiWeekPassage | undefined; panel: PanelLook }[];
  index: number;
  onShow: (index: number) => void;
  onOpen: (planId: string, dayNumber: number) => void;
};

/**
 * The day picked: its name and its passage — or, with several plans on it,
 * where in them the reader is, and the Study's bars, one per passage, on
 * every such day. The
 * passages sit side by side, swiped or tapped through; tapping past the last
 * comes back to the first.
 */
export function DayPanel({
  date,
  label,
  isToday,
  translation,
  pages,
  index,
  onShow,
  onOpen,
}: DayPanelProps) {
  const { width } = useWindowDimensions();
  const pageWidth = width - PAGE_INSET * 2;
  const pager = useRef<ScrollView>(null);
  const several = pages.length > 1;

  const advance = () => {
    const next = (index + 1) % pages.length;
    pager.current?.scrollTo({ x: next * pageWidth, animated: true });
    onShow(next);
  };

  return (
    <View testID="progress-day-panel" style={[styles.panel, { gap: space[16] }]}>
      <View style={[styles.labels, { gap: space[10] }]}>
        <MonoLabel variant="labelTracked" tone="accent" style={styles.caps}>
          {label}
        </MonoLabel>
        <MonoLabel
          variant="labelTracked"
          tone="textMuted"
          style={[styles.caps, styles.grow]}
          numberOfLines={1}
        >
          {several ? `${index + 1} of ${pages.length}` : ""}
        </MonoLabel>
        {several && (
          <Pressable
            testID="progress-day-bars"
            accessibilityRole="button"
            accessibilityLabel={`Passage ${index + 1} of ${pages.length}. Next passage`}
            hitSlop={space[10]}
            onPress={advance}
            style={{ width: Math.min(BAR_SHARE * pages.length, BARS_MOST_WIDTH) }}
          >
            <StepProgress steps={pages.length} activeIndex={index} />
          </Pressable>
        )}
      </View>
      <ScrollView
        key={date}
        style={styles.pager}
        ref={pager}
        horizontal
        pagingEnabled
        scrollEnabled={several}
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: index * pageWidth, y: 0 }}
        onMomentumScrollEnd={(event) =>
          onShow(Math.round(event.nativeEvent.contentOffset.x / pageWidth))
        }
      >
        {pages.map(({ passage, panel }) => (
          <View
            key={passage ? `${passage.planId}:${passage.dayNumber}` : "none"}
            style={{ width: pageWidth }}
          >
            <PassagePage
              passage={passage}
              panel={panel}
              named={several}
              isToday={isToday}
              translation={translation}
              onOpen={onOpen}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // The room the page leaves it, the same whatever it shows, so nothing around it moves.
  panel: { flex: 1, overflow: "hidden" },
  pager: { flex: 1 },
  labels: { flexDirection: "row", alignItems: "center" },
  caps: { textTransform: "uppercase" },
  grow: { flex: 1 },
});
