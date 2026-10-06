import { StyleSheet } from "react-native";

import { radius, space } from "@/theme";
import { Bone } from "@/ui/atoms/Bone";
import { Skeleton } from "@/ui/molecules/Skeleton";

const TITLE = 26;
/** A choice's row, as tall as `QuickCheckChoice` draws it. */
const CHOICE_HEIGHT = 64;
const CHOICES = 4;

/** A Quick Check on its way: its question, then its four choices. */
export function QuickCheckSkeleton({ testID }: { testID: string }) {
  return (
    <Skeleton testID={testID} style={styles.root}>
      <Bone width="90%" height={TITLE} />
      <Bone width="60%" height={TITLE} style={styles.question} />
      {Array.from({ length: CHOICES }, (_, index) => (
        <Bone key={index} height={CHOICE_HEIGHT} radius={radius[20]} />
      ))}
    </Skeleton>
  );
}

const styles = StyleSheet.create({
  root: { gap: space[12], paddingTop: space[16] },
  question: { marginBottom: space[16] },
});
