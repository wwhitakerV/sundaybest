import { Pressable, StyleSheet } from "react-native";

import { controlHeight, radius, space, useTheme } from "@/theme";
import type { Weekday } from "@/types/domain";
import { Card } from "@/ui/atoms/Card";
import { SFProBody } from "@/ui/typography/SFProBody";

const DAYS: readonly { value: Weekday; letter: string; name: string }[] = [
  { value: "sun", letter: "S", name: "Sunday" },
  { value: "mon", letter: "M", name: "Monday" },
  { value: "tue", letter: "T", name: "Tuesday" },
  { value: "wed", letter: "W", name: "Wednesday" },
  { value: "thu", letter: "T", name: "Thursday" },
  { value: "fri", letter: "F", name: "Friday" },
  { value: "sat", letter: "S", name: "Saturday" },
];

export type ReminderDaysProps = {
  selected: readonly Weekday[];
  onToggle: (day: Weekday) => void;
  testID: string;
};

/**
 * The week in one row, a letter a day. A picked day is a filled black circle,
 * its letter white — as the Health app sets a sleep schedule's days, and black
 * as everything picked is; a day left out is its grey letter alone.
 */
export function ReminderDays({ selected, onToggle, testID }: ReminderDaysProps) {
  const theme = useTheme();

  return (
    <Card testID={testID} kind="list" style={[styles.row, { padding: space[12] }]}>
      {DAYS.map((day) => {
        const picked = selected.includes(day.value);
        return (
          <Pressable
            key={day.value}
            testID={`${testID}-${day.value}`}
            accessibilityRole="checkbox"
            accessibilityLabel={day.name}
            accessibilityState={{ checked: picked }}
            onPress={() => onToggle(day.value)}
            style={[
              styles.day,
              {
                width: controlHeight.hitTarget,
                borderRadius: radius.pill,
                backgroundColor: picked ? theme.colors.controlPrimary : "transparent",
              },
            ]}
          >
            <SFProBody variant="letter" tone={picked ? "onControlPrimary" : "textMuted"}>
              {day.letter}
            </SFProBody>
          </Pressable>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  day: { height: controlHeight.hitTarget, alignItems: "center", justifyContent: "center" },
});
