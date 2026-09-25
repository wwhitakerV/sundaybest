import { StyleSheet, Text, View } from "react-native";
import { Flame } from "lucide-react-native";

import type { DayActivity } from "@/core/store";
import { useTheme } from "@/theme";
import { describeWeekDay, getWeekdayLabel } from "../logic/week";

const RING = 46;
const RING_WIDTH = 3;

export type WeekDaysProps = {
  /** The week, Sunday to Saturday, with what was finished each day — from the store. */
  days: readonly DayActivity[];
  today: string;
};

/**
 * The week's seven days: each one's name (today's in full ink) over a ring —
 * lit in accent with a flame on a day something was finished, plain on one
 * that wasn't.
 */
export function WeekDays({ days, today }: WeekDaysProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {days.map(({ date, completedDayCount }) => {
        const studied = completedDayCount > 0;
        return (
          <View
            key={date}
            testID={`progress-day-${date}`}
            accessible
            accessibilityLabel={describeWeekDay(date, today, studied)}
            style={styles.day}
          >
            <Text
              style={[
                theme.typography.body,
                { color: date === today ? theme.colors.text : theme.colors.textMuted },
              ]}
            >
              {getWeekdayLabel(date)}
            </Text>
            <View
              style={[
                styles.ring,
                { borderColor: studied ? theme.colors.accent : theme.colors.divider },
              ]}
            >
              {studied && (
                <Flame size={20} color={theme.colors.accent} strokeWidth={theme.icon.strokeWidth} />
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between" },
  day: { alignItems: "center", gap: 12 },
  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: RING_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
});
