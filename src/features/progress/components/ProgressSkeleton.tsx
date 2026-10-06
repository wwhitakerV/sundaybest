import { StyleSheet, View } from "react-native";

import { radius, space } from "@/theme";
import { Bone } from "@/ui/atoms/Bone";
import { Skeleton } from "@/ui/molecules/Skeleton";

/** A day of the week's dot. */
const DAY_SIZE = 36;
const DAYS = 7;
const STAT_HEIGHT = 96;
const UP_NEXT_HEIGHT = 140;

/** Progress on its way: the week, its numbers, and what's next. */
export function ProgressSkeleton({ testID }: { testID: string }) {
  return (
    <Skeleton testID={testID} style={styles.root}>
      <View style={styles.week}>
        {Array.from({ length: DAYS }, (_, index) => (
          <Bone key={index} width={DAY_SIZE} height={DAY_SIZE} radius={radius.pill} />
        ))}
      </View>
      <View style={styles.stats}>
        <Bone height={STAT_HEIGHT} radius={radius[20]} style={styles.stat} />
        <Bone height={STAT_HEIGHT} radius={radius[20]} style={styles.stat} />
      </View>
      <Bone height={UP_NEXT_HEIGHT} radius={radius[20]} />
    </Skeleton>
  );
}

const styles = StyleSheet.create({
  root: { gap: space[24] },
  week: { flexDirection: "row", justifyContent: "space-between" },
  stats: { flexDirection: "row", gap: space[12] },
  stat: { flex: 1, width: undefined },
});
