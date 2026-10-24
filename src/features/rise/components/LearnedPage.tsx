import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

import { burstFeedback, paintFeedback, tapFeedback } from "@/core/haptics/haptics";
import { RiseDrifter, useRiseDrifter } from "@/entities/rise";
import { space } from "@/theme";
import { PageEnter } from "@/ui/atoms/PageEnter";
import { SelectableText } from "@/ui/typography/SelectableText";
import type { LearnedRow } from "../logic/describe-rise";

/** The print margin at the sides: an advertisement's, not an app's. */
const MARGIN = space[40];
/** The air above the fact: it opens the page. */
const TOP = 64;

export type LearnedPageProps = {
  row: LearnedRow;
  /** Reduce Motion: the parts fade without moving, the balloon still. */
  still: boolean;
  /** The pager the page is on: while the balloon's held, it can't turn. */
  pager: ReturnType<typeof Gesture.Native>;
};

/**
 * One question, learned, as a page — a print advertisement's: the fact
 * itself, large, with air above it, the page's one statement; at its foot,
 * small, the credits — the red category and number over the question. Behind
 * it all, across the page, the outcome is alive: the balloon with the answer
 * and the time it kept on it, adrift, passing under the type; or the red
 * one, the answer on it, drifting, then bursting there — its debris resting
 * on the page's floor, the hairline. The words can be selected as iOS
 * selects — a word, handles, Copy, Look Up — and taken away; a tap lets go.
 * The balloon is in reach: held, dragged, thrown to ricochet off the page's
 * edges, or stopped dead by a tap — and while it's held the page won't turn.
 * Mounted each time it's arrived at, so it plays again. A fact too long for
 * the page scrolls; it's never cut.
 */
export function LearnedPage({ row, still, pager }: LearnedPageProps) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const rose = row.verdict === "right";
  const [clear, setClear] = useState(0);
  const drifter = useRiseDrifter({
    verdict: rose ? "rose" : "burst",
    label: row.answer,
    note: row.time,
    size,
    still,
    pager,
    onBurst: burstFeedback,
    onGrab: paintFeedback,
    onStop: tapFeedback,
  });
  // The fact's own scroll (a fact too long for the page): a touch on the balloon takes it from the
  // scroll, as from the pager — the balloon's in front of everything a finger reaches.
  const factScroll = useMemo(() => Gesture.Native(), []);
  drifter.touch.blocksExternalGesture(factScroll);
  const letGo = () => setClear((count) => count + 1);
  // A tap anywhere lets go of what's selected, as iOS does; a touch on the balloon plays with it.
  const touches = Gesture.Simultaneous(
    drifter.touch,
    Gesture.Tap().onEnd(() => {
      runOnJS(letGo)();
    }),
  );

  return (
    <GestureDetector gesture={touches}>
      <View
        testID={`rise-learned-${row.id}`}
        style={styles.page}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setSize({ width, height });
        }}
      >
        {size && (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <RiseDrifter
              game={drifter.game}
              verdict={rose ? "rose" : "burst"}
              width={size.width}
              height={size.height}
            />
          </View>
        )}
        <View style={styles.page}>
          {/* Scrolls only a fact too long for its room; a fact that fits never moves (no bounce). */}
          <GestureDetector gesture={factScroll}>
            <ScrollView
              style={styles.statement}
              contentContainerStyle={styles.statementInset}
              showsVerticalScrollIndicator={false}
              alwaysBounceVertical={false}
              bounces={false}
            >
              <PageEnter order={0} still={still}>
                <SelectableText
                  testID="rise-learned-fact"
                  clear={clear}
                  parts={[{ text: row.fact, face: "statement" }]}
                />
              </PageEnter>
            </ScrollView>
          </GestureDetector>
          <View style={styles.credits}>
            {/* What was asked, one selection: dragged from its label down into its question. */}
            <PageEnter order={1} still={still}>
              <SelectableText
                testID="rise-learned-asked"
                clear={clear}
                parts={[
                  {
                    text: `${row.category.toUpperCase()} · QUESTION ${row.number}`,
                    face: "label",
                    tone: "accent",
                  },
                  { text: row.question, face: "detail", tone: "textSupporting" },
                ]}
              />
            </PageEnter>
          </View>
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  statement: { flex: 1 },
  statementInset: { paddingHorizontal: MARGIN, paddingTop: TOP, paddingBottom: space[24] },
  // The credits at the page's foot, left: what was asked — clear of the floor, where debris rests.
  credits: { paddingHorizontal: MARGIN, paddingBottom: space[24] },
});
