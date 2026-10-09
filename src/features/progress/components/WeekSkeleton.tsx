import { StyleSheet, View } from "react-native";

import { radius, space } from "@/theme";
import { Bone } from "@/ui/atoms/Bone";
import { Skeleton } from "@/ui/molecules/Skeleton";
import { WEEK_TILE_HEIGHT } from "./WeekStrip";
import { SkeletonLines } from "@/ui/molecules/SkeletonLines";

/** The source line, and the title's, as wide as most read. */
const SOURCE = { width: 140, height: 12 } as const;
const TITLE = { width: 200, height: 28 } as const;
const DAYS = 7;

/** Progress on its way, in its own shape: the week's head, its seven days, and a verse. */
export function WeekSkeleton({ testID }: { testID: string }) {
  return (
    <Skeleton testID={testID} style={styles.root}>
      <View style={{ gap: space[10] }}>
        <Bone width={SOURCE.width} height={SOURCE.height} radius={radius.pill} />
        <Bone width={TITLE.width} height={TITLE.height} radius={radius[10]} />
      </View>
      <View style={[styles.days, { gap: space[6] }]}>
        {Array.from({ length: DAYS }, (_, index) => (
          <Bone key={index} height={WEEK_TILE_HEIGHT} radius={radius[16]} style={styles.day} />
        ))}
      </View>
      <SkeletonLines count={4} />
    </Skeleton>
  );
}

const styles = StyleSheet.create({
  root: { gap: space[28] },
  days: { flexDirection: "row" },
  day: { flex: 1, width: undefined },
});
