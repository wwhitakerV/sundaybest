import { ScrollView, StyleSheet, View } from "react-native";

import { Screen } from "@/ui/organisms/Screen";
import { TitleHeader } from "@/ui/molecules/TitleHeader";
import { FLOATING_NAV_BAR_CLEARANCE } from "@/ui/organisms/floatingNavBar";
import { StatCard } from "@/ui/molecules/StatCard";
import { UpNextCard } from "../components/UpNextCard";
import { WeekDays } from "@/entities/streak";
import { WeekNavigator } from "../components/WeekNavigator";
import { formatClockTime } from "@/utils/time/formatClockTime";
import { useProgressWeek } from "../hooks/use-progress-week";
import { describeDate } from "../logic/week";
import { space } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import { Span } from "@/ui/typography/Span";

/**
 * Progress, from the store's completion records and quiz attempts: a week
 * at a time — which days something was finished, stepping back through the
 * history — then what's up next, the plan under way, and the totals (the
 * streak, every day done, the latest quiz score, plans finished). Nothing is
 * counted here: every number is a selector's, so finishing a day or a quiz
 * anywhere shows the moment it's done.
 */
export function ProgressScreen() {
  const {
    today,
    week,
    title,
    previousWeek,
    nextWeek,
    streak,
    totals,
    quizScore,
    upNext,
    reminder,
    openUpNext,
  } = useProgressWeek();
  const plansDone = totals.completedPlanCount;

  return (
    <Screen testID="progress-screen" padded>
      <TitleHeader title="Progress" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <WeekNavigator
          lead={title.lead}
          range={title.range}
          onPrevious={previousWeek}
          onNext={nextWeek}
        />
        <WeekDays days={week} today={today} testIDPrefix="progress-day" />

        {upNext && (
          <>
            <SFProBody style={styles.centred} testID="progress-up-next">
              {"Up next "}
              <Span tone="textMuted">{describeDate(upNext.date, today)}</Span>
            </SFProBody>
            <UpNextCard
              title={upNext.plan.title}
              dayNumber={upNext.day.dayNumber}
              minutes={upNext.minutes}
              percent={upNext.percent}
              reminderTime={reminder?.enabled ? formatClockTime(reminder.time) : null}
              onPress={openUpNext}
            />
          </>
        )}

        <View style={styles.stats}>
          <StatCard
            testID="progress-stat-streak"
            value={String(streak.current)}
            label="Day streak"
          />
          <StatCard
            testID="progress-stat-days"
            value={String(totals.completedDayCount)}
            label="Days done"
          />
          <StatCard
            testID="progress-stat-quiz"
            value={quizScore ? `${quizScore.correct}/${quizScore.total}` : "–"}
            label="Quiz score"
          />
        </View>
        <SFProBody tone="textMuted" style={styles.centred} testID="progress-plans-done">
          {`${plansDone} ${plansDone === 1 ? "plan" : "plans"} finished`}
        </SFProBody>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space[24], paddingTop: space[8], paddingBottom: FLOATING_NAV_BAR_CLEARANCE },
  centred: { textAlign: "center" },
  stats: { flexDirection: "row", gap: space[12] },
});
