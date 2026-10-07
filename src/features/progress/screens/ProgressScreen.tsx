import { StyleSheet, View } from "react-native";

import { SkeletonHandoff } from "@/ui/molecules/SkeletonHandoff";
import { ScrollScreen } from "@/ui/organisms/ScrollScreen";
import { ScreenLoadError } from "@/ui/organisms/ScreenLoadError";
import { ProgressSkeleton } from "../components/ProgressSkeleton";
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
 * Progress, from the server's completion records and quiz attempts.
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
    loading,
    error,
    retry,
  } = useProgressWeek();

  const plansDone = totals.completedPlanCount;

  if (error) {
    return (
      <ScreenLoadError
        testID="progress-load-error"
        title="Couldn't load Progress"
        onRetry={retry}
      />
    );
  }

  return (
    <ScrollScreen
      testID="progress-screen"
      header={<TitleHeader title="Progress" />}
      contentStyle={styles.content}
    >
      <SkeletonHandoff
        testID="progress-handoff"
        pending={loading}
        skeleton={<ProgressSkeleton testID="progress-content-pending" />}
        style={styles.week}
      >
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
      </SkeletonHandoff>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: space[24],
    paddingTop: space[8],
    paddingBottom: FLOATING_NAV_BAR_CLEARANCE,
  },

  // The week's parts, as far apart as the page keeps them.
  week: {
    gap: space[24],
  },

  centred: {
    textAlign: "center",
  },

  stats: {
    flexDirection: "row",
    gap: space[12],
  },
});
