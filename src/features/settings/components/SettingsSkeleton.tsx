import { StyleSheet, View } from "react-native";

import { radius, space } from "@/theme";
import { Bone } from "@/ui/atoms/Bone";
import { Skeleton } from "@/ui/molecules/Skeleton";

const LABEL = 14;
/** A settings group: three rows. */
const GROUP_HEIGHT = 186;
const GROUPS = 2;

/** Settings on its way: its grouped rows, in their own shape. */
export function SettingsSkeleton({ testID }: { testID: string }) {
  return (
    <Skeleton testID={testID} style={styles.root}>
      {Array.from({ length: GROUPS }, (_, index) => (
        <View key={index} style={styles.group}>
          <Bone width="30%" height={LABEL} />
          <Bone height={GROUP_HEIGHT} radius={radius[24]} />
        </View>
      ))}
    </Skeleton>
  );
}

const styles = StyleSheet.create({
  root: { gap: space[28] },
  group: { gap: space[12] },
});
