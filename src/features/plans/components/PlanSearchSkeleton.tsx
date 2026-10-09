import { StyleSheet, View } from "react-native";

import { radius, space } from "@/theme";
import { Bone } from "@/ui/atoms/Bone";
import { Skeleton } from "@/ui/molecules/Skeleton";
import { PAGE_INSET } from "@/ui/organisms/Screen";

/** A result's artwork — 96 wide, 16:9 — and a line of its title. */
const ART_WIDTH = 96;
const ART_HEIGHT = 54;
const LINE = 14;
const ROWS = 4;

/** Plans being searched for: result rows in their own shape. */
export function PlanSearchSkeleton({ testID }: { testID: string }) {
  return (
    <Skeleton testID={testID}>
      {Array.from({ length: ROWS }, (_, index) => (
        <View
          key={index}
          style={[
            styles.row,
            { gap: space[16], paddingVertical: space[10], paddingHorizontal: PAGE_INSET },
          ]}
        >
          <Bone width={ART_WIDTH} height={ART_HEIGHT} radius={radius[10]} />
          <View style={[styles.lines, { gap: space[8] }]}>
            <Bone width="85%" height={LINE} />
            <Bone width="50%" height={LINE} />
          </View>
        </View>
      ))}
    </Skeleton>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  lines: { flex: 1 },
});
