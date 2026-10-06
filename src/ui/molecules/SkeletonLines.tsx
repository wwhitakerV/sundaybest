import { StyleSheet, View } from "react-native";

import { space } from "@/theme";
import { Bone } from "@/ui/atoms/Bone";

/** A line of body text's height on a skeleton. */
const LINE_HEIGHT = 14;
/** The last line of a paragraph runs short, as real text does. */
const LAST_LINE = "62%";

export type SkeletonLinesProps = { count: number; testID?: string };

/** A paragraph's worth of skeleton lines, the last one short. Compose inside a `Skeleton`. */
export function SkeletonLines({ count, testID }: SkeletonLinesProps) {
  return (
    <View testID={testID} style={styles.lines}>
      {Array.from({ length: count }, (_, index) => (
        <Bone key={index} height={LINE_HEIGHT} width={index === count - 1 ? LAST_LINE : "100%"} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ lines: { gap: space[10] } });
