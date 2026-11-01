import { StyleSheet, View } from "react-native";

import { FEATURE_ARTWORK_RADIUS } from "@/entities/plan";
import { controlHeight, radius, space } from "@/theme";
import { Bone } from "@/ui/atoms/Bone";
import { Skeleton } from "@/ui/molecules/Skeleton";

/** The lines the lead's words stand in for: its folio, its title (two lines) and the line from it (two). */
const LINES = { folio: 12, title: 26, line: 16 };
/** Its days, as wide as seven numerals led by "DAY", and Continue's pill. */
const ONWARD = { days: 150, pill: 140 };

export type LibrarySkeletonProps = { testID: string };

/**
 * The library's lead on its way, in its own shape (`PlanIssue`): the
 * artwork, the folio, the title's two lines, the line from it, and its days
 * opposite Continue.
 */
export function LibrarySkeleton({ testID }: LibrarySkeletonProps) {
  return (
    <Skeleton testID={testID} style={styles.lead}>
      <Bone height={0} style={styles.artwork} radius={FEATURE_ARTWORK_RADIUS} />
      <View style={styles.words}>
        <Bone width="55%" height={LINES.folio} />
        <Bone width="90%" height={LINES.title} />
        <Bone width="60%" height={LINES.title} />
        <Bone width="85%" height={LINES.line} />
        <Bone width="50%" height={LINES.line} />
      </View>
      <View style={styles.onward}>
        <Bone width={ONWARD.days} height={LINES.line} />
        <Bone width={ONWARD.pill} height={controlHeight.hitTarget} radius={radius.pill} />
      </View>
    </Skeleton>
  );
}

const styles = StyleSheet.create({
  lead: { gap: space[16] },
  artwork: { width: "100%", aspectRatio: 16 / 9, height: undefined },
  words: { gap: space[8] },
  onward: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
