import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, EllipsisVertical } from "lucide-react-native";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { StepProgress } from "@/ui/StepProgress";
import { VideoThumbnail } from "@/ui/VideoThumbnail";
import { useTheme } from "@/theme";
import {
  getCurrentPlanDay,
  getDayMinutes,
  getPlanById,
  getPlanDays,
  getPlanProgress,
  getSermonForPlan,
  useAppSelector,
} from "@/core/store";
import { PlanDayRow } from "../components/PlanDayRow";
import { studyHref } from "../logic/routes";

/**
 * Plan Overview, from the store: the sermon it's built from, its title, how
 * far through it is, and every day — done, open, or still locked — with
 * Continue opening the day the user is on. Everything is read from the store
 * on every render, so coming back shows what's changed since.
 */
export function PlanOverviewScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { planId = "" } = useLocalSearchParams<{ planId: string }>();
  const plan = useAppSelector((state) => getPlanById(state, planId));
  const sermon = useAppSelector((state) => getSermonForPlan(state, planId));
  const progress = useAppSelector((state) => getPlanProgress(state, planId));
  const currentDay = useAppSelector((state) => getCurrentPlanDay(state, planId));
  const days = useAppSelector((state) =>
    getPlanDays(state, planId).map((day) => ({ day, minutes: getDayMinutes(state, day.id) })),
  );

  if (!plan || !progress) return null;
  const openDay = (dayNumber: number) => router.push(studyHref(plan.id, dayNumber));
  const finished = progress.remainingDayCount === 0;

  return (
    <Screen testID="plan-overview-screen" padded>
      {/* The title sits large below, under the sermon, as in the design. */}
      <ScreenHeader
        testID="plan-overview"
        title=""
        left={
          <HeaderIconButton
            testID="plan-overview-back-button"
            icon={ArrowLeft}
            accessibilityLabel="Back"
            onPress={() => router.back()}
          />
        }
        right={
          <HeaderIconButton
            testID="plan-overview-more-button"
            icon={EllipsisVertical}
            accessibilityLabel="More"
            onPress={() => undefined}
          />
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <VideoThumbnail
          testID="plan-overview-sermon"
          uri={sermon?.thumbnailUrl ?? null}
          style={styles.thumbnail}
        />

        <View style={styles.titles}>
          <Text
            testID="plan-overview-title"
            accessibilityRole="header"
            style={[theme.typography.display, { color: theme.colors.text }]}
          >
            {plan.title}
          </Text>
          {sermon && (
            <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
              From {sermon.title}
              {sermon.church ? ` · ${sermon.church}` : ""}
            </Text>
          )}
        </View>

        <View style={styles.days}>
          <View style={styles.daysHeader}>
            <Text style={[theme.typography.body, { color: theme.colors.text }]}>Your days</Text>
            <Text
              testID="plan-overview-current-day"
              style={[theme.typography.body, { color: theme.colors.textMuted }]}
            >
              {progress.currentDayNumber} of {progress.totalDays}
            </Text>
          </View>
          <View
            accessible
            accessibilityLabel={`${progress.completedDayCount} of ${progress.totalDays} days done`}
          >
            <StepProgress
              testID="plan-overview-progress"
              steps={progress.totalDays}
              // Days are done in order, so the first not yet done is the active segment.
              activeIndex={progress.completedDayCount}
            />
          </View>
          {days.map(({ day, minutes }) => (
            <PlanDayRow
              key={day.id}
              testID={`plan-overview-day-${day.dayNumber}`}
              title={day.reading.title}
              dayNumber={day.dayNumber}
              minutes={minutes}
              status={day.status}
              onPress={() => openDay(day.dayNumber)}
            />
          ))}
        </View>
      </ScrollView>

      {currentDay && (
        <Button
          testID="plan-overview-continue-button"
          label={
            finished ? `Review day ${currentDay.dayNumber}` : `Continue day ${currentDay.dayNumber}`
          }
          onPress={() => openDay(currentDay.dayNumber)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { gap: 24, paddingBottom: 16 },
  thumbnail: { borderRadius: 24 },
  titles: { gap: 8 },
  days: { gap: 12 },
  daysHeader: { flexDirection: "row", justifyContent: "space-between", marginHorizontal: 4 },
});
