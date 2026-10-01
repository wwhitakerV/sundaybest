import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/ui/organisms/Screen";
import { TitleHeader } from "@/ui/molecules/TitleHeader";
import { FLOATING_NAV_BAR_CLEARANCE } from "@/ui/organisms/floatingNavBar";
import { addDays } from "@/utils/dates/addDays";
import { planOverviewHref } from "@/features/plans";
import {
  getDayMinutes,
  getLatestQuizScore,
  getPlanProgress,
  getProgressTotals,
  getReminder,
  getStreak,
  getUpNext,
  getWeeklyCompletionCounts,
  useAppSelector,
  useToday,
} from "@/core/store";
import { StatCard } from "../components/StatCard";
import { UpNextCard } from "../components/UpNextCard";
import { WeekDays } from "../components/WeekDays";
import { WeekNavigator } from "../components/WeekNavigator";
import { formatClockTime } from "@/utils/time/formatClockTime";
import { describeDate, getWeekTitle } from "../logic/week";
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
  const router = useRouter();
  const today = useToday();
  // Which week is shown: 0 is this one, -1 the one before, and so on.
  const [weekOffset, setWeekOffset] = useState(0);

  const week = useAppSelector((state) =>
    getWeeklyCompletionCounts(state, addDays(today, weekOffset * 7)),
  );
  const streak = useAppSelector((state) => getStreak(state, today));
  const totals = useAppSelector(getProgressTotals);
  const quizScore = useAppSelector(getLatestQuizScore);
  const upNext = useAppSelector((state) => getUpNext(state, today));
  const upNextDetail = useAppSelector((state) =>
    upNext
      ? {
          minutes: getDayMinutes(state, upNext.day.id),
          percent: getPlanProgress(state, upNext.plan.id)?.completionPercentage ?? 0,
        }
      : null,
  );
  const reminder = useAppSelector((state) => getReminder(state, "dailyStudy"));

  const title = getWeekTitle(week.at(0)?.date ?? today, week.at(-1)?.date ?? today);
  const plansDone = totals.completedPlanCount;

  return (
    <Screen testID="progress-screen" padded>
      <TitleHeader title="Progress" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <WeekNavigator
          lead={title.lead}
          range={title.range}
          onPrevious={() => setWeekOffset((offset) => offset - 1)}
          onNext={() => setWeekOffset((offset) => offset + 1)}
        />
        <WeekDays days={week} today={today} />

        {upNext && upNextDetail && (
          <>
            <SFProBody style={styles.centred} testID="progress-up-next">
              {"Up next "}
              <Span tone="textMuted">{describeDate(upNext.date, today)}</Span>
            </SFProBody>
            <UpNextCard
              title={upNext.plan.title}
              dayNumber={upNext.day.dayNumber}
              minutes={upNextDetail.minutes}
              percent={upNextDetail.percent}
              reminderTime={reminder?.enabled ? formatClockTime(reminder.time) : null}
              onPress={() => router.push(planOverviewHref(upNext.plan.id))}
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
