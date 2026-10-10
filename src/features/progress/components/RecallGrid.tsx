import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { space, useTheme } from "@/theme";
import { SideFade } from "@/ui/atoms/SideFade";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import type { DayBlock } from "../logic/recall";
// The dots, kept to bring back: import { QuickCheckBlock, blockHeight } from "./QuickCheckBlock";
import { QuickCheckCapsule, capsuleBarHeight, capsuleCaretRoom } from "./QuickCheckCapsule";

/** The line between days: a card's edge, clear enough to part them. */
const RULE = 1;
// The dots' height, kept to bring back: const BLOCK_HEIGHT = blockHeight("large");
const BLOCK_HEIGHT = capsuleBarHeight("large");
/** The fade at the row's end, saying it runs on. */
const FADE = space[40];
/** At its start, as wide as the page's inset, so the newest block sits clear of it until slid. */
const START_FADE = PAGE_INSET;

export type RecallGridProps = {
  /** Each day's Quick Check, newest first. */
  blocks: readonly DayBlock[];
  /** The missed question in view: its ring firmer. */
  shownId: string | null;
  /** A ring tapped: the question it stands for. */
  onShow: (id: string) => void;
  /** A finger dragging the row, or not: the page holds its back swipe meanwhile. */
  onDragging: (dragging: boolean) => void;
  testID: string;
};

/**
 * Every Quick Check as a capsule of its questions — a segment each —
 * newest on the left, a hairline between days, a caret's room and its date
 * under each; dragged left to go further back, both its edges fading. Green
 * where correct, amber where missed, grey where never answered; a red caret
 * under the one in view, and one tapped shows its question. When the one in
 * view is out of sight, the row brings its block in.
 */
export function RecallGrid({ blocks, shownId, onShow, onDragging, testID }: RecallGridProps) {
  const theme = useTheme();
  const scroll = useRef<ScrollView>(null);
  const view = useRef({ offset: 0, width: 0 });
  const [frames, setFrames] = useState<ReadonlyMap<string, { x: number; width: number }>>(
    new Map(),
  );

  const shownBlock = blocks.find((block) => block.dots.some((dot) => dot.id === shownId));
  const frame = shownBlock ? frames.get(shownBlock.quizId) : undefined;
  useEffect(() => {
    if (!frame || view.current.width === 0) return;
    const { offset, width } = view.current;
    if (frame.x < offset + START_FADE) {
      scroll.current?.scrollTo({ x: Math.max(frame.x - START_FADE, 0) });
    } else if (frame.x + frame.width > offset + width - FADE) {
      scroll.current?.scrollTo({ x: frame.x + frame.width - width + FADE });
    }
  }, [frame]);

  return (
    <View testID={testID}>
      <ScrollView
        ref={scroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(event) => {
          view.current.offset = event.nativeEvent.contentOffset.x;
        }}
        onLayout={(event) => {
          view.current.width = event.nativeEvent.layout.width;
        }}
        onScrollBeginDrag={() => onDragging(true)}
        onScrollEndDrag={() => onDragging(false)}
        contentContainerStyle={{ paddingLeft: START_FADE, paddingRight: FADE }}
      >
        {blocks.map((block, index) => (
          <View
            key={block.quizId}
            // Measured here, where it sits in the row, so bringing it into view lands right.
            onLayout={(event) => {
              const { x, width } = event.nativeEvent.layout;
              setFrames((current) => new Map(current).set(block.quizId, { x, width }));
            }}
            style={styles.day}
          >
            {index > 0 && (
              <View
                style={[
                  styles.rule,
                  { backgroundColor: theme.colors.containerBorder, marginHorizontal: space[16] },
                ]}
              />
            )}
            <View
              accessible
              accessibilityLabel={`${block.date}: ${block.dots.filter((dot) => dot.correct).length} of ${block.dots.length} correct`}
              style={[styles.block, { gap: space[8] }]}
            >
              {/* The dots, kept to bring back:
              <QuickCheckBlock
                dots={block.dots}
                size="large"
                shownId={shownId}
                onShow={onShow}
                testID={testID}
              /> */}
              <QuickCheckCapsule
                dots={block.dots}
                size="large"
                shownId={shownId}
                onShow={onShow}
                testID={testID}
              />
              <MonoLabel variant="label" tone="text">
                {block.date}
              </MonoLabel>
            </View>
          </View>
        ))}
      </ScrollView>
      <SideFade width={START_FADE} side="start" />
      <SideFade width={FADE} />
    </View>
  );
}

const styles = StyleSheet.create({
  day: { flexDirection: "row" },
  // As tall as a block's dots, beside them; the dates sit under the line's foot.
  // Beside the pills themselves, below the caret's room over them.
  rule: { width: RULE, height: BLOCK_HEIGHT, marginTop: capsuleCaretRoom("large") },
  // Its date under it, from its left edge.
  block: { alignItems: "flex-start" },
});
