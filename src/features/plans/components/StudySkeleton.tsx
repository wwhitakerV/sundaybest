import { StyleSheet } from "react-native";

import { radius, space } from "@/theme";
import { Bone } from "@/ui/atoms/Bone";
import { Skeleton } from "@/ui/molecules/Skeleton";
import { SkeletonLines } from "@/ui/molecules/SkeletonLines";

const TITLE = 28;
const PASSAGE_HEIGHT = 120;

/** A study day on its way: its title, its passage, and its reading. */
export function StudySkeleton({ testID }: { testID: string }) {
  return (
    <Skeleton testID={testID} style={styles.root}>
      <Bone width="75%" height={TITLE} />
      <Bone height={PASSAGE_HEIGHT} radius={radius[20]} />
      <SkeletonLines count={5} />
      <SkeletonLines count={4} />
    </Skeleton>
  );
}

const styles = StyleSheet.create({ root: { gap: space[24], paddingTop: space[16] } });
