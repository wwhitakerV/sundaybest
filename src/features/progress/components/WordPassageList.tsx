import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { LinearTransition, ReduceMotion } from "react-native-reanimated";
import { ChevronDown, ChevronUp } from "lucide-react-native";

import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";
import { selectionFeedback } from "@/core/haptics/haptics";
import { motion, space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { Divider } from "@/ui/atoms/Divider";
import { SFProBody } from "@/ui/typography/SFProBody";
import { panelEnter } from "./panel-enter";

/** Settings' chevron size, as its rows end. */
const CHEVRON = 18;
/** A row's least height: Settings' rows'. */
const MIN_ROW_HEIGHT = 64;

/** A row opening and closing, and everything below moving with it: one soft spring. */
const SPRING = LinearTransition.springify()
  .damping(motion.expand.damping)
  .stiffness(motion.expand.stiffness)
  .mass(motion.expand.mass)
  .reduceMotion(ReduceMotion.System);

export type WordPassageListProps = {
  rows: readonly { key: string; reference: string; text: string | null }[];
};

/**
 * A book's passages, in chapter and verse order, on Settings' group card:
 * each row its reference, and its Scripture under it — one line, cut with
 * "…", until the row is opened with its chevron to show it whole, and closed
 * again, on a soft spring the rows below and the card follow. Keyed by its
 * book, it fades in rising as the book changes (`panelEnter`).
 */
export function WordPassageList({ rows }: WordPassageListProps) {
  const reduceMotion = useReduceMotion();
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const toggle = (key: string) => {
    selectionFeedback();
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  };

  return (
    <Animated.View testID="word-passages" entering={panelEnter(reduceMotion)}>
      <Card radius={24} layout={SPRING} style={styles.card}>
        {rows.map((row, index) => (
          <Animated.View key={row.key} layout={SPRING}>
            {index > 0 && <Divider />}
            <PassageRow
              testID={`word-passage-${row.key}`}
              reference={row.reference}
              text={row.text}
              open={open.has(row.key)}
              onToggle={() => toggle(row.key)}
            />
          </Animated.View>
        ))}
      </Card>
    </Animated.View>
  );
}

/**
 * One passage: its reference, its Scripture under it in a line or whole, and
 * the chevron that opens and closes it — held where it sits with the row
 * closed, so it never moves as the row grows.
 */
function PassageRow({
  reference,
  text,
  open,
  onToggle,
  testID,
}: {
  reference: string;
  text: string | null;
  open: boolean;
  onToggle: () => void;
  testID: string;
}) {
  const theme = useTheme();
  const [closedHeight, setClosedHeight] = useState(0);
  const Chevron = open ? ChevronUp : ChevronDown;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={reference}
      accessibilityState={{ expanded: open }}
      disabled={!text}
      onPress={onToggle}
      style={[
        styles.row,
        { gap: space[16], paddingHorizontal: space[16], paddingVertical: space[14] },
      ]}
    >
      <View
        style={[styles.copy, { gap: space[2] }]}
        onLayout={(event) => {
          if (!open) setClosedHeight(event.nativeEvent.layout.height);
        }}
      >
        <SFProBody numberOfLines={1}>{reference}</SFProBody>
        {text && (
          <SFProBody variant="rowDetail" tone="textSupporting" {...(!open && { numberOfLines: 1 })}>
            {text}
          </SFProBody>
        )}
      </View>
      {text && (
        // As tall as the row's words when it's closed, the chevron in its middle: open, it stays there.
        <View style={[styles.chevron, closedHeight > 0 && { height: closedHeight }]}>
          <Chevron
            size={CHEVRON}
            color={theme.colors.textSupporting}
            strokeWidth={theme.icon.strokeWidthStrong}
          />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Settings' group card: rows on it with hairlines between, nothing spilling past its corners.
  card: { overflow: "hidden" },
  row: {
    minHeight: MIN_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "flex-start",
    overflow: "hidden",
  },
  copy: { flex: 1, minHeight: MIN_ROW_HEIGHT - 2 * space[14], justifyContent: "center" },
  chevron: { justifyContent: "center" },
});
