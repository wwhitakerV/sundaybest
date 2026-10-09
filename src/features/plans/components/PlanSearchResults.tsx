import { StyleSheet, View } from "react-native";
import { LayoutAnimationConfig } from "react-native-reanimated";

import { space } from "@/theme";
import { CompactButton } from "@/ui/atoms/CompactButton";
import { SkeletonHandoff } from "@/ui/molecules/SkeletonHandoff";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { SFProBody } from "@/ui/typography/SFProBody";
import type { MatchPart, PlanSearchStatus } from "../logic/plan-search";
import { PlanSearchRow } from "./PlanSearchRow";
import { PlansEmpty } from "./PlansEmpty";
import { PlanSearchSkeleton } from "./PlanSearchSkeleton";

export type PlanSearchResultsProps = {
  status: PlanSearchStatus;
  rows: readonly {
    id: string;
    title: string;
    parts: readonly MatchPart[];
    detail: readonly MatchPart[];
    thumbnailUrl: string | null;
  }[];
  /** What it says when nothing matches. */
  noMatch: string;
  onOpen: (planId: string) => void;
  onRetry: () => void;
};

/**
 * What the search has found: before the first word, what to search and that
 * nothing's found yet; then the rows,
 * kept in place while the next search is out — or, with none to keep, rows
 * in their own shape until the answer comes; that nothing matches; or that
 * the search couldn't be made, with another try.
 */
export function PlanSearchResults({
  status,
  rows,
  noMatch,
  onOpen,
  onRetry,
}: PlanSearchResultsProps) {
  // Nothing typed, or nothing found: said in the middle of the empty page, as Plans says it.
  if (status === "idle" || (rows.length === 0 && status === "empty")) {
    return (
      <View style={styles.middle}>
        {status === "idle" ? (
          <PlansEmpty
            testID="plan-search-idle"
            title="Search your plans"
            compact
            message={"Type a title, a church, or a passage.\nWhat matches shows here."}
          />
        ) : (
          <PlansEmpty testID="plan-search-no-match" compact title="No matches" message={noMatch} />
        )}
      </View>
    );
  }

  if (rows.length === 0 && status === "error") {
    return (
      <View testID="plan-search-error" style={[styles.note, { gap: space[16] }]}>
        <SFProBody variant="reading" tone="textInactive">
          Couldn’t search your plans.
        </SFProBody>
        <CompactButton
          testID="plan-search-retry"
          label="Try again"
          tone="soft"
          align="start"
          onPress={onRetry}
        />
      </View>
    );
  }

  return (
    <SkeletonHandoff
      testID="plan-search-handoff"
      pending={rows.length === 0}
      skeleton={<PlanSearchSkeleton testID="plan-search-pending" />}
    >
      {/* The first rows arrive with the handoff's fade; only rows found later fade in on their own. */}
      <LayoutAnimationConfig skipEntering>
        {rows.map((row) => (
          <PlanSearchRow
            key={row.id}
            testID={`plan-search-result-${row.id}`}
            title={row.title}
            parts={row.parts}
            detail={row.detail}
            thumbnailUrl={row.thumbnailUrl}
            onPress={() => onOpen(row.id)}
          />
        ))}
      </LayoutAnimationConfig>
    </SkeletonHandoff>
  );
}

/** Twice what lifts the message: it sits this much over half above the middle of the space. */
const MESSAGE_LIFT = 2 * space[24];

const styles = StyleSheet.create({
  note: { paddingHorizontal: PAGE_INSET, paddingTop: space[8] },
  // In the page above the field, lifted a little above its middle.
  middle: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: PAGE_INSET,
    paddingBottom: MESSAGE_LIFT,
  },
});
