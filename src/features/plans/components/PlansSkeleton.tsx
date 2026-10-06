import { StyleSheet, View } from "react-native";

import { radius, space } from "@/theme";
import { Bone } from "@/ui/atoms/Bone";
import { Skeleton } from "@/ui/molecules/Skeleton";

/** A library card's artwork, then its words. */
const ART_HEIGHT = 168;
const LINE = 14;
const CARDS = 2;

/** Plans on its way: library cards in their own shape. */
export function PlansSkeleton({ testID }: { testID: string }) {
  return (
    <Skeleton testID={testID} style={styles.root}>
      {Array.from({ length: CARDS }, (_, index) => (
        <View key={index} style={styles.card}>
          <Bone height={ART_HEIGHT} radius={radius[20]} />
          <Bone width="70%" height={LINE} />
          <Bone width="40%" height={LINE} />
        </View>
      ))}
    </Skeleton>
  );
}

const styles = StyleSheet.create({
  root: { gap: space[28] },
  card: { gap: space[10] },
});
