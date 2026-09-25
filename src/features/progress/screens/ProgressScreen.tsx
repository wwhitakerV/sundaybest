import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { UserRound } from "lucide-react-native";

import { Screen } from "@/ui/Screen";
import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { TitleHeader } from "@/ui/TitleHeader";
import { FLOATING_NAV_BAR } from "@/ui/floatingNavBar";
import { useTheme } from "@/theme";
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
import { describeDate, formatTime, getWeekTitle } from "../logic/week";

/** Room under the content for the floating tab bar. */
const BOTTOM_CLEARANCE =
  FLOATING_NAV_BAR.capsuleHeight + FLOATING_NAV_BAR.bottomMargin + FLOATING_NAV_BAR.sideMargin;

/**
 * Progress, from the store's completion records and quiz attempts: a week
 * at a time — which days something was finished, stepping back through the
 * history — then what's up next, the plan under way, and the totals (the
 * streak, every day done, the latest quiz score, plans finished). Nothing is
 * counted here: every number is a selector's, so finishing a day or a quiz
 * anywhere shows the moment it's done.
 */
export function ProgressScreen() {
  const theme = useTheme();
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
      <TitleHeader
        title="Progress"
        actions={
          <HeaderIconButton
            testID="progress-account-button"
            icon={UserRound}
            accessibilityLabel="Account"
            bordered={false}
            onPress={() => router.push("/(tabs)/settings")}
          />
        }
      />

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
            <Text
              testID="progress-up-next"
              style={[theme.typography.body, styles.centred, { color: theme.colors.text }]}
            >
              {"Up next "}
              <Text style={{ color: theme.colors.textMuted }}>
                {describeDate(upNext.date, today)}
              </Text>
            </Text>
            <UpNextCard
              title={upNext.plan.title}
              dayNumber={upNext.day.dayNumber}
              minutes={upNextDetail.minutes}
              percent={upNextDetail.percent}
              reminderTime={reminder?.enabled ? formatTime(reminder.time) : null}
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
        <Text
          testID="progress-plans-done"
          style={[theme.typography.body, styles.centred, { color: theme.colors.textMuted }]}
        >
          {`${plansDone} ${plansDone === 1 ? "plan" : "plans"} finished`}
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 24, paddingTop: 8, paddingBottom: BOTTOM_CLEARANCE },
  centred: { textAlign: "center" },
  stats: { flexDirection: "row", gap: 12 },
});
