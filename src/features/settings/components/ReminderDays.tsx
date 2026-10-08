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

/** A day's round mark: the same weight picked or not, so nothing shifts as it changes. */
const DAY_RING = 1.5;

export type ReminderDaysProps = {
  selected: readonly Weekday[];
  onToggle: (day: Weekday) => void;
  testID: string;
};

/**
 * The week in one row, a letter a day, each in a quiet ring. A picked day's
 * letter is red, the app's colour for what's chosen; a day left out stays quiet grey.
 */
export function ReminderDays({ selected, onToggle, testID }: ReminderDaysProps) {
  const theme = useTheme();

  return (
    <Card testID={testID} style={[styles.row, { padding: space[12] }]}>
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
                borderWidth: DAY_RING,
                borderRadius: radius.pill,
                borderColor: theme.colors.containerBorder,
              },
            ]}
          >
            <SFProBody variant="letter" tone={picked ? "accent" : "textMuted"}>
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
