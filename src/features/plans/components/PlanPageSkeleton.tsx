import { StyleSheet, View } from "react-native";

import { controlHeight, radius, space } from "@/theme";
import { Bone } from "@/ui/atoms/Bone";
import { Skeleton } from "@/ui/molecules/Skeleton";

/** The lines a page's words stand in for: its label, its title (two lines), its church and today. */
const LINES = { label: 12, title: 30, detail: 16 };
/** The days' cards, in the shape they'll have: two in view. */
const DAY_CARD = { share: 0.62, height: 128 };

export type PlanPageSkeletonProps = { testID: string };

/**
 * A plan's page on its way, in its own shape: the artwork, the label, the
 * title's two lines, the church and today's study, Continue, and the days.
 */
export function PlanPageSkeleton({ testID }: PlanPageSkeletonProps) {
  return (
    <Skeleton testID={testID} style={styles.page}>
      <Bone height={0} style={styles.artwork} radius={radius[16]} />
      <View style={styles.words}>
        <Bone width="40%" height={LINES.label} />
        <Bone width="90%" height={LINES.title} />
        <Bone width="60%" height={LINES.title} />
        <Bone width="45%" height={LINES.detail} />
        <Bone width="70%" height={LINES.detail} />
      </View>
      <Bone height={controlHeight.button} radius={radius.pill} />
      <View style={styles.days}>
        <Bone width={`${DAY_CARD.share * 100}%`} height={DAY_CARD.height} radius={radius[28]} />
        <Bone width={`${DAY_CARD.share * 100}%`} height={DAY_CARD.height} radius={radius[28]} />
      </View>
    </Skeleton>
  );
}

const styles = StyleSheet.create({
  page: { gap: space[20] },
  artwork: { width: "100%", aspectRatio: 16 / 9, height: undefined },
  words: { gap: space[8] },
  days: { flexDirection: "row", gap: space[12], overflow: "hidden" },
});
