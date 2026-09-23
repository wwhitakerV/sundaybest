import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type Weekday = (typeof WEEKDAYS)[number];

export type DayStripProps = {
  /** The day to highlight. */
  active: Weekday;
  testID?: string;
};

/**
 * A static row of the seven weekdays with the active one highlighted.
 *
 * Deliberately not interactive: it shows where you are in the week, it is not
 * a control. If a screen ever needs to *change* the day, that is a different
 * component rather than a prop on this one.
 */
export function DayStrip({ active, testID }: DayStripProps) {
  const theme = useTheme();

  return (
    <View testID={testID} style={styles.row}>
      {WEEKDAYS.map((day) => (
        <Text
          key={day}
          style={[
            theme.typography.dayStrip,
            { color: day === active ? theme.colors.selected : theme.colors.textInactive },
          ]}
        >
          {day}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
