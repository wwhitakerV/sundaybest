import { StyleSheet, View } from "react-native";

import { radius, space } from "@/theme";
import { Bone } from "@/ui/atoms/Bone";
import { Skeleton } from "@/ui/molecules/Skeleton";

/** The active plan's hero, roughly as tall as it draws. */
const HERO_HEIGHT = 420;
/** A plan row's artwork (`PlanRow`). */
const ART_SIZE = 64;
const LINE = 14;
const ROWS = 3;

/** Home on its way: the hero, then the plan list, in their own shapes. */
export function HomeSkeleton({ testID }: { testID: string }) {
  return (
    <Skeleton testID={testID} style={styles.root}>
      <Bone height={HERO_HEIGHT} radius={radius[28]} />
      <Bone width="30%" height={LINE} />
      {Array.from({ length: ROWS }, (_, index) => (
        <View key={index} style={styles.row}>
          <Bone width={ART_SIZE} height={ART_SIZE} radius={radius[16]} />
          <View style={styles.words}>
            <Bone width="80%" height={LINE} />
            <Bone width="45%" height={LINE} />
          </View>
        </View>
      ))}
    </Skeleton>
  );
}

const styles = StyleSheet.create({
  root: { gap: space[20] },
  row: { flexDirection: "row", alignItems: "center", gap: space[16] },
  words: { flex: 1, gap: space[8] },
});
