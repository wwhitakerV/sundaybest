import { StyleSheet, View } from "react-native";
import { Flame } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { formatWeekday } from "@/utils/dates/formatWeekday";
import { describeWeekDay } from "../logic/week-day";
import { SFProBody } from "@/ui/typography/SFProBody";

const RING = 46;
const RING_WIDTH = 3;

export type WeekDaysProps = {
  /** The week, Sunday to Saturday, with how many days were finished on each. */
  days: readonly { date: string; completedDayCount: number }[];
  today: string;
  /** Each day's testID is this, then its date. */
  testIDPrefix: string;
};

/**
 * The week's seven days: each one's name (today's in full ink) over a ring —
 * lit in accent with a flame on a day something was finished, plain on one
 * that wasn't.
 */
export function WeekDays({ days, today, testIDPrefix }: WeekDaysProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {days.map(({ date, completedDayCount }) => {
        const studied = completedDayCount > 0;
        return (
          <View
            key={date}
            testID={`${testIDPrefix}-${date}`}
            accessible
            accessibilityLabel={describeWeekDay(date, today, studied)}
            style={styles.day}
          >
            <SFProBody tone={date === today ? "text" : "textMuted"}>
              {formatWeekday(date)}
            </SFProBody>
            <View
              testID={`${testIDPrefix}-${date}-ring`}
              style={[
                styles.ring,
                { borderColor: studied ? theme.colors.accent : theme.colors.progressTrack },
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
  day: { alignItems: "center", gap: space[12] },
  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: RING_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
});
