import { StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";

/** A hairline, just heavy enough to read as progress. */
const THICKNESS = 2;

export type MeterLineProps = {
  /** How far along — clamped to 0…total. */
  value: number;
  total: number;
  /** What a screen reader says: "8 of 15 answered". */
  accessibilityLabel: string;
  testID?: string;
};

/**
 * A still line showing how far along something is — the brand red over a
 * quiet track. Unlike `ProgressLine`, which fills over time, it sits at its
 * value and doesn't move.
 */
export function MeterLine({ value, total, accessibilityLabel, testID }: MeterLineProps) {
  const theme = useTheme();
  const now = Math.min(Math.max(value, 0), Math.max(total, 0));
  const fraction = total > 0 ? now / total : 0;

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: total, now }}
      style={[styles.track, { backgroundColor: theme.colors.divider }]}
    >
      <View
        style={[styles.fill, { width: `${fraction * 100}%`, backgroundColor: theme.colors.accent }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: THICKNESS, overflow: "hidden" },
  fill: { height: THICKNESS },
});
