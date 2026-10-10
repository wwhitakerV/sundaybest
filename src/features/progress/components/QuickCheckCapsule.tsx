import { Pressable, StyleSheet, View } from "react-native";
import { Play } from "lucide-react-native";

import { radius, useTheme } from "@/theme";
import type { DayBlock } from "../logic/recall";

/**
 * Its two sizes: the Quick Check page's grid, tapped; and a list row's
 * picture, glanced at. A segment a question; the gaps between them the page's
 * own colour.
 */
const SIZES = {
  large: { segment: 16, height: 24, gap: 2, caret: 10, caretRow: 16 },
  small: { segment: 5, height: 10, gap: 1, caret: 0, caretRow: 0 },
} as const;

/** How tall the pill itself is, without the caret's room: what a line beside it matches. */
export function capsuleBarHeight(size: keyof typeof SIZES): number {
  return SIZES[size].height;
}

/** The caret's room over the pill: how far down the pill itself starts. */
export function capsuleCaretRoom(size: keyof typeof SIZES): number {
  return SIZES[size].caretRow;
}

export type QuickCheckCapsuleProps = {
  dots: DayBlock["dots"];
  size: keyof typeof SIZES;
  /** The question in view: a red caret under its segment. */
  shownId?: string | null;
  /** Given, a segment tapped shows its question; without, it's only looked at. */
  onShow?: (id: string) => void;
  testID?: string;
};

/**
 * One day's Quick Check as a single pill split into its questions, in their
 * order: green where correct, amber where missed, grey where never answered —
 * how the day went, at a glance, before anything's counted. Under the
 * question in view, a small solid red caret over it points down at it.
 */
export function QuickCheckCapsule({
  dots,
  size,
  shownId = null,
  onShow,
  testID,
}: QuickCheckCapsuleProps) {
  const theme = useTheme();
  const measure = SIZES[size];
  const shownAt = dots.findIndex((dot) => dot.id === shownId);
  // Each segment's tap reaches the capsule's full height and a little past.
  const slop = { top: measure.gap * 4, bottom: measure.gap * 4 };

  return (
    <View>
      {measure.caret > 0 && (
        // The caret's row, always there so every capsule stands level: over the question in
        // view, a small solid caret pointing down at it — "this one", in the app's red — clear of
        // the dates under the capsules. Laid out in the row (a spacer, then the caret).
        <View style={[styles.caretRow, { height: measure.caretRow }]}>
          {shownAt !== -1 && (
            <>
              <View
                style={{
                  width:
                    shownAt * (measure.segment + measure.gap) +
                    (measure.segment - measure.caret) / 2,
                }}
              />
              <View
                testID={testID && `${testID}-caret`}
                // Turned as a box, not as the drawing: the icon itself stays unrotated.
                style={[{ width: measure.caret, height: measure.caret }, styles.down]}
              >
                <Play
                  size={measure.caret}
                  color={theme.colors.accent}
                  fill={theme.colors.accent}
                  strokeWidth={theme.icon.strokeWidthStrong}
                />
              </View>
            </>
          )}
        </View>
      )}
      <View
        style={[
          styles.capsule,
          { height: measure.height, gap: measure.gap, borderRadius: radius.pill },
        ]}
      >
        {dots.map((dot) => {
          const colour = dot.correct
            ? theme.colors.correct
            : dot.answered
              ? theme.colors.incorrect
              : theme.colors.progressTrack;
          const segment = (
            <View
              style={{ width: measure.segment, height: measure.height, backgroundColor: colour }}
            />
          );
          return onShow ? (
            <Pressable
              key={dot.id}
              {...(testID && { testID: `${testID}-segment-${dot.id}` })}
              accessibilityRole="button"
              accessibilityLabel={
                dot.correct
                  ? "A question answered correctly"
                  : dot.answered
                    ? "A question to revisit"
                    : "A question not answered"
              }
              accessibilityState={{ selected: dot.id === shownId }}
              hitSlop={slop}
              onPress={() => onShow(dot.id)}
            >
              {segment}
            </Pressable>
          ) : (
            <View key={dot.id}>{segment}</View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The pill's ends round off its first and last questions.
  capsule: { flexDirection: "row", overflow: "hidden", alignSelf: "flex-start" },
  caretRow: { flexDirection: "row", alignItems: "center" },
  // The play triangle turned to point down: a caret.
  down: { transform: [{ rotate: "90deg" }] },
});
