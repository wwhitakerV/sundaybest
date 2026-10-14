import { ScrollView, StyleSheet, View, type ScrollViewProps } from "react-native";
import Animated, { LayoutAnimationConfig, LinearTransition } from "react-native-reanimated";

import { motion, space } from "@/theme";
import { CompactButton } from "@/ui/atoms/CompactButton";
import { SkeletonHandoff } from "@/ui/molecules/SkeletonHandoff";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { SFProBody } from "@/ui/typography/SFProBody";
import type { MatchPart, PlanSearchStatus } from "../logic/plan-search";
import { PlanSearchRow } from "./PlanSearchRow";
import { PlansEmpty } from "./PlansEmpty";
import { PlanSearchSkeleton } from "./PlanSearchSkeleton";

/** A row moving to where it now ranks. */
const MOVE = LinearTransition.duration(motion.results.moveMs);

/**
 * About a screenful of rows: drawn at once, and the only ones that fade in
 * as they're found. Rows further down are drawn as they near view, and
 * weren't in sight as the results came, so they need no fade.
 */
const FIRST_SCREEN_ROWS = 12;

type Row = {
  id: string;
  title: string;
  parts: readonly MatchPart[];
  detail: readonly MatchPart[];
  thumbnailUrl: string | null;
};

export type PlanSearchResultsProps = {
  status: PlanSearchStatus;
  rows: readonly Row[];
  /** What it says when nothing matches. */
  noMatch: string;
  /** Room under the last row: the field's, and the keyboard's while it's up. */
  foot: number;
  onOpen: (planId: string) => void;
  onRetry: () => void;
};

/**
 * What the search has found, filling the page from the top: before the
 * first word, what to search and that nothing's found yet; then the rows on
 * a list that draws only those near view — kept in place while the next
 * search is out, gliding to their new places when it answers — or, with
 * none to keep, rows in their own shape until the answer comes; that
 * nothing matches; or that the search couldn't be made, with another try.
 */
export function PlanSearchResults({
  status,
  rows,
  noMatch,
  foot,
  onOpen,
  onRetry,
}: PlanSearchResultsProps) {
  // Dragging the page puts the keyboard away; a tap on a row opens it at once.
  const scroll = {
    testID: "plan-search-results",
    style: styles.fill,
    contentContainerStyle: [styles.content, { paddingTop: space[12], paddingBottom: foot }],
    keyboardShouldPersistTaps: "handled",
    keyboardDismissMode: "on-drag",
    showsVerticalScrollIndicator: false,
  } as const satisfies ScrollViewProps;

  // Nothing typed, or nothing found: said in the middle of the empty page, as Plans says it.
  if (status === "idle" || (rows.length === 0 && status === "empty")) {
    return (
      <ScrollView {...scroll}>
        <View style={styles.middle}>
          {status === "idle" ? (
            <PlansEmpty
              testID="plan-search-idle"
              title="Search your plans"
              compact
              message={"Type a title, a church, or a passage.\nWhat matches shows here."}
            />
          ) : (
            <PlansEmpty
              testID="plan-search-no-match"
              compact
              title="No matches"
              message={noMatch}
            />
          )}
        </View>
      </ScrollView>
    );
  }

  if (rows.length === 0 && status === "error") {
    return (
      <ScrollView {...scroll}>
        <View testID="plan-search-error" style={[styles.note, { gap: space[16] }]}>
          <SFProBody variant="reading" tone="textInactive">
            Couldn&apos;t search your plans.
          </SFProBody>
          <CompactButton
            testID="plan-search-retry"
            label="Try again"
            tone="soft"
            align="start"
            onPress={onRetry}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <SkeletonHandoff
      testID="plan-search-handoff"
      fill
      pending={rows.length === 0}
      skeleton={
        <ScrollView {...scroll}>
          <PlanSearchSkeleton testID="plan-search-pending" />
        </ScrollView>
      }
    >
      {/* The first rows arrive with the handoff's fade; only rows found later fade in on their own. */}
      <LayoutAnimationConfig skipEntering>
        <Animated.FlatList
          {...scroll}
          data={rows}
          keyExtractor={(row) => row.id}
          initialNumToRender={FIRST_SCREEN_ROWS}
          itemLayoutAnimation={MOVE}
          renderItem={({ item, index }) => (
            <PlanSearchRow
              testID={`plan-search-result-${item.id}`}
              title={item.title}
              parts={item.parts}
              detail={item.detail}
              thumbnailUrl={item.thumbnailUrl}
              fades={index < FIRST_SCREEN_ROWS}
              onPress={() => onOpen(item.id)}
            />
          )}
        />
      </LayoutAnimationConfig>
    </SkeletonHandoff>
  );
}

/** Twice what lifts the message: it sits this much over half above the middle of the space. */
const MESSAGE_LIFT = 2 * space[24];

const styles = StyleSheet.create({
  fill: { flex: 1 },
  // At least the page's height, so a message can sit in its middle.
  content: { flexGrow: 1 },
  note: { paddingHorizontal: PAGE_INSET, paddingTop: space[8] },
  // In the page above the field, lifted a little above its middle.
  middle: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: PAGE_INSET,
    paddingBottom: MESSAGE_LIFT,
  },
});
