import { StyleSheet, View } from "react-native";

import { useTheme, type Theme } from "@/theme";
import { getStepState, type StepState } from "@/utils/steps/getStepState";

const SEGMENT_HEIGHT = 3;
const GAP = 4;

const SEGMENT_COLOR: Record<StepState, (theme: Theme) => string> = {
  completed: (theme) => theme.palette.black,
  active: (theme) => theme.colors.accent,
  upcoming: (theme) => theme.palette.greyLightest,
};

export type StepProgressProps = {
  /** Total number of steps — 4 for the daily study flow, 3 for Quick Check. */
  steps: number;
  /** 0-indexed. Segments before this are complete; this one is active; after are upcoming. */
  activeIndex: number;
  testID?: string;
};

/**
 * The horizontal line tracker under a study or Quick Check header: solid
 * dark for a completed step, accent-coloured for the current one, light
 * grey for what's ahead. Shared by Read/Scripture/Reflect/Pray (4 steps)
 * and Quick Check (3 steps) rather than duplicated per screen.
 */
export function StepProgress({ steps, activeIndex, testID }: StepProgressProps) {
  const theme = useTheme();

  return (
    <View testID={testID} style={styles.row}>
      {Array.from({ length: steps }, (_, index) => {
        const color = SEGMENT_COLOR[getStepState(index, activeIndex)](theme);

        return (
          <View
            key={index}
            testID={testID && `${testID}-segment-${index}`}
            style={[styles.segment, { backgroundColor: color }]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: GAP },
  segment: { flex: 1, height: SEGMENT_HEIGHT, borderRadius: SEGMENT_HEIGHT / 2 },
});
