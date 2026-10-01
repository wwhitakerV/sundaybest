import { Pressable, StyleSheet, View } from "react-native";

import type { PlanLength } from "@/types/domain";
import { controlHeight, radius, space, useTheme } from "@/theme";
import { getPlanEndsLine } from "@/utils/plans/getPlanEndsLine";
import { MonoBody } from "@/ui/typography/MonoBody";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

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
      <SFProBody tone="textMuted" style={styles.heading}>
        How many days?
      </SFProBody>
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
              <SFProTitle variant="headlineRegular">{days}</SFProTitle>
            </Pressable>
          );
        })}
      </View>
      <MonoBody variant="supporting" tone="textMuted">
        {getPlanEndsLine(value)}
      </MonoBody>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[12] },
  heading: { marginLeft: space[6] },
  chips: { flexDirection: "row", justifyContent: "space-between" },
  // 44pt wide keeps each chip a full tap target.
  chip: {
    width: controlHeight.hitTarget,
    height: 57,
    borderRadius: radius[14],
    alignItems: "center",
    justifyContent: "center",
  },
});
