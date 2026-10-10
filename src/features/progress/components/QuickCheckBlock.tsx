import { Pressable, StyleSheet, View } from "react-native";

import { radius, space, useTheme } from "@/theme";
import type { DayBlock } from "../logic/recall";

/** Five columns of two: every Quick Check's ten places, kept low. */
const COLUMNS = 5;
const UP = 2;

/**
 * Its two sizes: the Quick Check page's grid, tapped; and a list row's
 * picture, glanced at. A missed one is an amber dot — a target when in view; a
 * question never answered, a dash.
 */
const SIZES = {
  large: { dot: 12, gap: space[8], shownRing: 2.5, dash: 2.5, shownDash: 3 },
  small: { dot: 6, gap: 3, shownRing: 1, dash: 1.5, shownDash: 1.5 },
} as const;

/** How tall a block of a size is: its two rows and the gap between. */
export function blockHeight(size: keyof typeof SIZES): number {
  const { dot, gap } = SIZES[size];
  return UP * dot + (UP - 1) * gap;
}

export type QuickCheckBlockProps = {
  dots: DayBlock["dots"];
  size: keyof typeof SIZES;
  /** The missed question in view: its ring firmer. */
  shownId?: string | null;
  /** Given, a ring or dash tapped shows its question; without, the block is only looked at. */
  onShow?: (id: string) => void;
  testID?: string;
};

/**
 * One day's Quick Check, a place a question: the bottom row first, left to
 * right — questions 1 to 5 — then the row above, 6 to 10; so the bottom row
 * is full before the top starts, and a place is empty only when the Quick
 * Check is shorter. Green where remembered, amber where missed, a dash
 * where never answered.
 */
export function QuickCheckBlock({
  dots,
  size,
  shownId = null,
  onShow,
  testID,
}: QuickCheckBlockProps) {
  const theme = useTheme();
  const measure = SIZES[size];
  const slot = { width: measure.dot, height: measure.dot };
  // Rows top to bottom; the bottom row holds questions 1 to 5.
  const rows = Array.from({ length: UP }, (_, fromTop) => UP - 1 - fromTop);
  // Each place's tap reaches halfway to its neighbours.
  const slop = measure.gap / 2;

  return (
    <View style={{ height: blockHeight(size), gap: measure.gap }}>
      {rows.map((row) => (
        <View key={`row-${row}`} style={[styles.row, { gap: measure.gap }]}>
          {Array.from({ length: COLUMNS }, (_, column) => {
            const dot = dots[row * COLUMNS + column];
            if (!dot) return <View key={`empty-${column}`} style={slot} />;
            const shown = dot.id === shownId;

            if (dot.correct) {
              return (
                <View
                  key={dot.id}
                  style={[
                    slot,
                    { borderRadius: radius.pill, backgroundColor: theme.colors.correct },
                  ]}
                />
              );
            }
            const mark = dot.answered ? (
              // Missed: an amber dot. The one in view, a ring round a smaller dot — a target.
              shown ? (
                <View
                  style={[
                    slot,
                    styles.target,
                    {
                      borderRadius: radius.pill,
                      borderWidth: measure.shownRing,
                      // "This one", in the app's red — as the timeline and The Word mark it.
                      borderColor: theme.colors.accent,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: measure.dot - measure.shownRing * 3,
                      height: measure.dot - measure.shownRing * 3,
                      borderRadius: radius.pill,
                      backgroundColor: theme.colors.incorrect,
                    }}
                  />
                </View>
              ) : (
                <View
                  style={[
                    slot,
                    { borderRadius: radius.pill, backgroundColor: theme.colors.incorrect },
                  ]}
                />
              )
            ) : (
              // Never answered: a dash, grey — firmer and black when it's the one in view.
              <View style={[slot, styles.dashSlot]}>
                <View
                  style={{
                    width: measure.dot,
                    height: shown ? measure.shownDash : measure.dash,
                    borderRadius: radius.pill,
                    backgroundColor: shown ? theme.colors.accent : theme.colors.textSupporting,
                  }}
                />
              </View>
            );
            return onShow ? (
              <Pressable
                key={dot.id}
                {...(testID && { testID: `${testID}-${dot.answered ? "ring" : "dash"}-${dot.id}` })}
                accessibilityRole="button"
                accessibilityLabel={
                  dot.answered ? "A question to revisit" : "A question not answered"
                }
                accessibilityState={{ selected: shown }}
                hitSlop={slop}
                onPress={() => onShow(dot.id)}
              >
                {mark}
              </Pressable>
            ) : (
              <View key={dot.id}>{mark}</View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  dashSlot: { justifyContent: "center" },
  target: { alignItems: "center", justifyContent: "center" },
});
