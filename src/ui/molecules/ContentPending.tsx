import { StyleSheet } from "react-native";

import { space } from "@/theme";
import { Bone } from "@/ui/atoms/Bone";
import { Skeleton } from "./Skeleton";
import { SkeletonLines } from "./SkeletonLines";

/** A heading's height on a skeleton. */
const TITLE_HEIGHT = 24;

export type ContentPendingProps = {
  testID: string;
  compact?: boolean;
};

/**
 * A content region on its way when there's no skeleton shaped for it: a
 * heading and a paragraph, breathing in place. Never a spinner; never the
 * whole screen. Screens with their own shape use their own skeleton.
 */
export function ContentPending({ testID, compact = false }: ContentPendingProps) {
  return (
    <Skeleton testID={testID} style={styles.root}>
      <Bone width="55%" height={TITLE_HEIGHT} />
      <SkeletonLines count={compact ? 3 : 5} />
    </Skeleton>
  );
}

const styles = StyleSheet.create({
  root: { gap: space[16], paddingVertical: space[16] },
});
