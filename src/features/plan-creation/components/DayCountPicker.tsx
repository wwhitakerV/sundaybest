import { Pressable, StyleSheet, Text, View } from "react-native";

import type { PlanLength } from "@/types/domain";
import { useTheme } from "@/theme";
import { getPlanEndsLine } from "@/utils/plans/getPlanEndsLine";

const LENGTHS: readonly PlanLength[] = [1, 2, 3, 4, 5, 6, 7];

export type DayCountPickerProps = {
  value: PlanLength;
  onChange: (days: PlanLength) => void;
  testID: string;
};

/** "How many days?": one chip per length, 1 to 7, and when that plan would end. */
export function DayCountPicker({ value, onChange, testID }: DayCountPickerProps) {
  const theme = useTheme();

  return (
    <View testID={testID} style={styles.wrap}>
      <Text style={[theme.typography.body, styles.heading, { color: theme.colors.textMuted }]}>
        How many days?
      </Text>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {LENGTHS.map((days) => {
          const selected = days === value;
          return (
            <Pressable
              key={days}
              testID={`${testID}-${days}`}
              accessibilityRole="radio"
              accessibilityLabel={`${days} ${days === 1 ? "day" : "days"}`}
              accessibilityState={{ selected }}
              onPress={() => onChange(days)}
              style={[
                styles.chip,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: selected ? theme.colors.text : theme.colors.divider,
                  borderWidth: selected ? 2.5 : 1,
                },
              ]}
            >
              <Text style={[theme.typography.headline, styles.day, { color: theme.colors.text }]}>
                {days}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[theme.typography.supporting, { color: theme.colors.textMuted }]}>
        {getPlanEndsLine(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  heading: { marginLeft: 6 },
  chips: { flexDirection: "row", justifyContent: "space-between" },
  // 44pt wide keeps each chip a full tap target.
  chip: { width: 44, height: 57, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  day: { fontWeight: "400" },
});
