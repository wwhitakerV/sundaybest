import { StyleSheet, View } from "react-native";
import { Flame } from "lucide-react-native";

import { WeekDays } from "@/entities/streak";
import { radius, space, useTheme } from "@/theme";
import { Button } from "@/ui/atoms/Button";
import { Card } from "@/ui/atoms/Card";
import { IconRing } from "@/ui/atoms/IconRing";
import { MilestoneScreen } from "@/ui/organisms/MilestoneScreen";
import { SFProBody } from "@/ui/typography/SFProBody";
import { StudyNotFound } from "../components/StudyNotFound";
import { NextDayCard } from "../components/NextDayCard";
import { useDayComplete } from "../hooks/use-day-complete";

/** The streak pill's flame. */
const STREAK_ICON = 20;

/**
 * Where the Daily Study session lands once a day's done: the day marked
 * done, the streak it keeps going, the week so far, and what's up next — then
 * Done!, back to the plan. A day with a Quick Check lands here only once it's
 * taken. A milestone page (`MilestoneScreen`), the layout the others follow.
 * What each does: `useDayComplete`.
 */
export function DayCompleteScreen() {
  const theme = useTheme();
  const view = useDayComplete();
  if (!view.found) return <StudyNotFound testID="day-complete-not-found" />;

  return (
    <MilestoneScreen
      testID="day-complete-screen"
      mark={<IconRing testID="day-complete-ring" icon={Flame} done />}
      title={`Day ${view.dayNumber} done`}
      badge={
        view.streakLabel && (
          <View
            testID="day-complete-streak"
            style={[styles.streak, { backgroundColor: theme.colors.segmentBackground }]}
          >
            <Flame
              size={STREAK_ICON}
              color={theme.colors.text}
              strokeWidth={theme.icon.strokeWidth}
            />
            <SFProBody variant="listItem">{view.streakLabel}</SFProBody>
          </View>
        )
      }
      footer={<Button testID="day-complete-done-button" label="Done!" onPress={view.done} />}
    >
      <Card testID="day-complete-week" style={styles.week}>
        <WeekDays days={view.week} today={view.today} testIDPrefix="day-complete-day" />
      </Card>
      {view.upNext && (
        <NextDayCard
          testID="day-complete-up-next"
          title={view.upNext.title}
          when={view.upNext.when}
        />
      )}
    </MilestoneScreen>
  );
}

const styles = StyleSheet.create({
  streak: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[10],
    paddingHorizontal: space[18],
    paddingVertical: space[10],
    borderRadius: radius.pill,
  },
  week: { padding: space[20] },
});
