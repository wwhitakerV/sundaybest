import { StatusBar, StyleSheet, Text, View } from "react-native";
import { useIsFocused, useRouter } from "expo-router";
import Animated from "react-native-reanimated";
import { UserRound } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { PAGE_INSET, Screen } from "@/ui/Screen";
import { FLOATING_NAV_BAR } from "@/ui/floatingNavBar";
import { useTheme } from "@/theme";
import { planOverviewHref, studyHref } from "@/features/plans";
import {
  getActivePlan,
  getCurrentPlanDay,
  getDayMinutes,
  getPlanProgress,
  getSamplePlan,
  getSermonForPlan,
  getUserPlans,
  useAppSelector,
} from "@/core/store";
import { ActivePlanBar } from "../components/ActivePlanBar";
import { ActivePlanHero } from "../components/ActivePlanHero";
import { ArtworkFlight } from "../components/ArtworkFlight";
import { CONTENT_TOP, useHeroCollapse } from "../hooks/use-hero-collapse";
import { PlanList } from "../components/PlanList";
import { PlanRow } from "../components/PlanRow";
import { StartHereCard } from "../components/StartHereCard";
import { describeActivePlan } from "../logic/active-plan-hero";
import { describePlan } from "../logic/describe-plan";
import { homePlanOverviewHref } from "../logic/routes";

/** Room under the content for the floating tab bar. */
const BOTTOM_CLEARANCE =
  FLOATING_NAV_BAR.capsuleHeight + FLOATING_NAV_BAR.bottomMargin + FLOATING_NAV_BAR.sideMargin;

/**
 * Home, from the store. With a plan under way: that plan featured up top,
 * full width in its sermon's colour (`ActivePlanHero`) — where it stands,
 * Continue straight into today's study, and its artwork zooming open into
 * Plan Detail — then all the user's plans. Scrolling up, the header fades
 * and the featured plan collapses into a plan bar pinned at the top
 * (`useHeroCollapse`), reversing on the way back. With
 * none: a card to add a sermon, and the sample to try (or their other plans,
 * if they have some waiting). The tab bar's + also starts a new plan.
 */
export function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const active = useAppSelector(getActivePlan);
  const progress = useAppSelector((state) => (active ? getPlanProgress(state, active.id) : null));
  const sermon = useAppSelector((state) => (active ? getSermonForPlan(state, active.id) : null));
  const today = useAppSelector((state) => {
    const day = active ? getCurrentPlanDay(state, active.id) : null;
    return day ? { day, minutes: getDayMinutes(state, day.id) } : null;
  });
  const hasPlans = useAppSelector((state) => getUserPlans(state).length > 0);
  const sample = useAppSelector(getSamplePlan);
  const sampleDetail = useAppSelector((state) =>
    sample ? describePlan(sample, getPlanProgress(state, sample.id)) : "",
  );

  const isFocused = useIsFocused();
  const {
    insetTop,
    snapOffsets,
    onContentSizeChange,
    onScroll,
    onHeaderLayout,
    onScrollLayout,
    onHeroContentLayout,
    heroSlotHeight,
    headerStyle,
    heroFrameStyle,
    heroContentStyle,
    barStyle,
    flightStyle,
    heroArtworkStyle,
    barThumbStyle,
    phase,
  } = useHeroCollapse();
  const words =
    progress && today
      ? describeActivePlan({
          currentDay: progress.currentDayNumber,
          totalDays: progress.totalDays,
          dayTitle: today.day.reading.title,
          minutes: today.minutes,
        })
      : null;

  const openPlan = (planId: string) => router.push(planOverviewHref(planId));
  const addSermon = () => router.push("/(plan-creation)/paste-sermon");

  return (
    <View style={styles.root}>
      {/* Built like an iOS scroll screen: the scroll view runs edge to edge,
          and the header and content apply the page inset themselves. The
          header never moves; the content scrolls up *over* it (see
          `styles.scroll`), and it fades as the content comes. */}
      <Screen testID="home-tab-screen" padded="vertical">
        <Animated.View
          testID="home-tab-header"
          onLayout={onHeaderLayout}
          pointerEvents={phase.headerTouchable ? "auto" : "none"}
          style={[styles.header, headerStyle]}
        >
          <Text style={[theme.typography.masthead, { color: theme.colors.text }]}>SUNDAYBEST</Text>
          <HeaderIconButton
            testID="home-tab-account-button"
            icon={UserRound}
            accessibilityLabel="Account"
            bordered={false}
            onPress={() => router.push("/(tabs)/settings")}
          />
        </Animated.View>

        <Animated.ScrollView
          testID="home-tab-scroll"
          // A flick that would stop mid-collapse glides on to fully open or
          // fully in; one that would carry past it coasts on as it would.
          onContentSizeChange={onContentSizeChange}
          snapToOffsets={snapOffsets}
          snapToStart={false}
          snapToEnd={false}
          onLayout={onScrollLayout}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {active && progress && words ? (
            <ActivePlanHero
              title={active.title}
              church={sermon?.church ?? null}
              thumbnailUrl={sermon?.thumbnailUrl ?? null}
              colors={sermon?.thumbnailColors ?? []}
              words={words}
              currentDay={progress.currentDayNumber}
              totalDays={progress.totalDays}
              completedDayCount={progress.completedDayCount}
              href={homePlanOverviewHref(active.id)}
              onContinue={() => router.push(studyHref(active.id, progress.currentDayNumber))}
              frameStyle={heroFrameStyle}
              slotHeight={heroSlotHeight}
              onContentLayout={onHeroContentLayout}
              contentStyle={heroContentStyle}
              artworkStyle={heroArtworkStyle}
            />
          ) : (
            <StartHereCard onAddSermon={addSermon} />
          )}

          {hasPlans ? (
            <>
              <PlanList onOpenPlan={openPlan} />
              <PlanList onOpenPlan={openPlan} />
              <PlanList onOpenPlan={openPlan} />
            </>
          ) : (
            sample && (
              <View style={styles.sample}>
                <Text
                  style={[theme.typography.body, styles.label, { color: theme.colors.textMuted }]}
                >
                  Try a sample
                </Text>
                <PlanRow
                  testID="home-tab-sample-plan"
                  title={sample.title}
                  detail={sampleDetail}
                  done={false}
                  onPress={() => openPlan(sample.id)}
                />
              </View>
            )
          )}
        </Animated.ScrollView>
      </Screen>

      {/* Over everything, from the very top of the phone. */}
      {active && progress && words && (
        <ActivePlanBar
          title={active.title}
          day={words.day}
          thumbnailUrl={sermon?.thumbnailUrl ?? null}
          colors={sermon?.thumbnailColors ?? []}
          topInset={insetTop}
          touchable={phase.barTouchable}
          style={barStyle}
          thumbStyle={barThumbStyle}
          href={homePlanOverviewHref(active.id)}
          onContinue={() => router.push(studyHref(active.id, progress.currentDayNumber))}
        />
      )}
      {active && <ArtworkFlight thumbnailUrl={sermon?.thumbnailUrl ?? null} style={flightStyle} />}
      {/* Light over the plan's colour — only while Home's the screen shown. */}
      {isFocused && phase.lightStatusBar && <StatusBar barStyle="light-content" />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: PAGE_INSET,
  },
  // Unclipped: content scrolled past the scroll view's top keeps drawing,
  // over the header — which, drawn first, sits beneath it. Touches only land
  // inside the scroll view's own frame, so the header's button still works.
  scroll: { flex: 1, overflow: "visible" },
  content: {
    gap: 28,
    paddingHorizontal: PAGE_INSET,
    paddingTop: CONTENT_TOP,
    paddingBottom: BOTTOM_CLEARANCE,
  },
  sample: { gap: 12 },
  label: { marginLeft: 6 },
});
