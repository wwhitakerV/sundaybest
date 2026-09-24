import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Ellipsis } from "lucide-react-native";

import { PAGE_INSET, Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { FadeInView } from "@/ui/FadeInView";
import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { StepProgress } from "@/ui/StepProgress";
import { FLOATING_NAV_BAR } from "@/ui/floatingNavBar";
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

/** Room at the bottom for the floating tab bar, so Continue sits above it, not under it. */
const BOTTOM_NAV_CLEARANCE =
  FLOATING_NAV_BAR.capsuleHeight + FLOATING_NAV_BAR.bottomMargin + FLOATING_NAV_BAR.sideMargin;

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
    // Built like an iOS scroll screen: the scroll view runs edge to edge, and
    // the header, content, and Continue apply the page inset themselves. All
    // three fade in together as the screen appears, rather than jumping in.
    <Screen testID="plan-overview-screen" padded="vertical" style={styles.clearBottomNav}>
      <FadeInView style={styles.inset}>
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
              icon={Ellipsis}
              accessibilityLabel="More"
              onPress={() => undefined}
            />
          }
        />
      </FadeInView>

      <FadeInView testID="plan-overview-content" style={styles.scroll}>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* The zoom's target: the part of Plan Detail that mirrors Home's
            plan card — sermon, title, progress. Opening and closing from that
            card, iOS lines the card up with this block rather than cropping
            the whole screen from the middle; the rest falls outside it. Does
            nothing when there's no zoom (opened from the Plans tab). */}
          <Link.AppleZoomTarget>
            <View collapsable={false} style={styles.hero}>
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

              <View style={styles.progress}>
                <View style={styles.daysHeader}>
                  <Text style={[theme.typography.body, { color: theme.colors.text }]}>
                    Your days
                  </Text>
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
              </View>
            </View>
          </Link.AppleZoomTarget>

          <View style={styles.days}>
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
      </FadeInView>

      {currentDay && (
        <FadeInView style={styles.inset}>
          <Button
            testID="plan-overview-continue-button"
            label={
              finished
                ? `Review day ${currentDay.dayNumber}`
                : `Continue day ${currentDay.dayNumber}`
            }
            onPress={() => openDay(currentDay.dayNumber)}
          />
        </FadeInView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  clearBottomNav: { paddingBottom: BOTTOM_NAV_CLEARANCE },
  inset: { paddingHorizontal: PAGE_INSET },
  scroll: { flex: 1 },
  // 12 between the top block and the first day, as between the progress bar
  // and the days before they were split for the zoom target.
  content: { gap: 12, paddingHorizontal: PAGE_INSET, paddingBottom: 16 },
  // Sermon, titles, and progress: the zoom target, 24 apart as before.
  hero: { gap: 24 },
  progress: { gap: 12 },
  thumbnail: { borderRadius: 24 },
  titles: { gap: 8 },
  days: { gap: 12 },
  daysHeader: { flexDirection: "row", justifyContent: "space-between", marginHorizontal: 4 },
});
