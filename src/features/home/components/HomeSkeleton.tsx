import { StyleSheet } from "react-native";

import { radius, space } from "@/theme";
import { Bone } from "@/ui/atoms/Bone";
import { Skeleton } from "@/ui/molecules/Skeleton";

/** The active plan's hero, roughly as tall as it draws. */
const HERO_HEIGHT = 420;

/** Home on its way: the hero, in its own shape. */
export function HomeSkeleton({ testID }: { testID: string }) {
  return (
    <Skeleton testID={testID} style={styles.root}>
      <Bone height={HERO_HEIGHT} radius={radius[28]} />
    </Skeleton>
  );
}

const styles = StyleSheet.create({
  root: { gap: space[20] },
});
