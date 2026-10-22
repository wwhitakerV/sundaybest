import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { burstFeedback } from "@/core/haptics/haptics";
import { RiseDrifter } from "@/entities/rise";
import { space, useTheme } from "@/theme";
import { PageEnter } from "@/ui/atoms/PageEnter";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SerifTitle } from "@/ui/typography/SerifTitle";
import { SFProBody } from "@/ui/typography/SFProBody";
import type { LearnedRow } from "../logic/describe-rise";

/** The print margin at the sides: an advertisement's, not an app's. */
const MARGIN = space[40];
/** The air above the fact: it opens the page. */
const TOP = 64;
/**
 * The words' halo: a soft edge of the page's white round each letter, so
 * they still read where a balloon or paint passes under them.
 */
const HALO_RADIUS = 10;

export type LearnedPageProps = {
  row: LearnedRow;
  /** Reduce Motion: the parts fade without moving, the balloon still. */
  still: boolean;
};

/**
 * One question, learned, as a page — a print advertisement's: the fact
 * itself, large, with air above it, the page's one statement; at its foot,
 * small, the credits — the red category and number over the question. Behind
 * it all, across the page, the outcome is alive: the balloon with the answer
 * and the time it kept on it, adrift, passing under the type; or the red
 * one, the answer on it, drifting, then bursting there — its debris resting
 * on the page's floor, the hairline. The words can be long-pressed to copy.
 * Mounted each time it's arrived at, so it plays again. A fact too long for
 * the page scrolls; it's never cut.
 */
export function LearnedPage({ row, still }: LearnedPageProps) {
  const { colors } = useTheme();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const rose = row.verdict === "right";
  const halo = { textShadowColor: colors.background, textShadowRadius: HALO_RADIUS };

  return (
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
            key={`${size.width}x${size.height}`}
            verdict={rose ? "rose" : "burst"}
            label={row.answer}
            note={row.time}
            width={size.width}
            height={size.height}
            still={still}
            onBurst={burstFeedback}
          />
        </View>
      )}
      <ScrollView
        style={styles.statement}
        contentContainerStyle={styles.statementInset}
        showsVerticalScrollIndicator={false}
      >
        <PageEnter order={0} still={still}>
          <SerifTitle variant="statement" selectable style={halo}>
            {row.fact}
          </SerifTitle>
        </PageEnter>
      </ScrollView>
      <View style={styles.credits}>
        <View style={styles.asked}>
          <PageEnter order={1} still={still}>
            <MonoLabel variant="labelTracked" tone="accent" selectable style={halo}>
              {`${row.category.toUpperCase()} · QUESTION ${row.number}`}
            </MonoLabel>
          </PageEnter>
          <PageEnter order={2} still={still}>
            <SFProBody variant="rowDetail" tone="textSupporting" selectable style={halo}>
              {row.question}
            </SFProBody>
          </PageEnter>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  statement: { flex: 1 },
  statementInset: { paddingHorizontal: MARGIN, paddingTop: TOP, paddingBottom: space[24] },
  // The credits at the page's foot, left: what was asked — clear of the floor, where debris rests.
  credits: { paddingHorizontal: MARGIN, paddingBottom: space[24] },
  asked: { gap: space[4] },
});
