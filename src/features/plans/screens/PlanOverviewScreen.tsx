import { useContext } from "react";
import { StatusBar, StyleSheet, View, useWindowDimensions } from "react-native";
import { useIsFocused, useLocalSearchParams, useRouter } from "expo-router";
import Animated from "react-native-reanimated";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { ArrowLeft, BookOpen, Ellipsis } from "lucide-react-native";

import { PAGE_INSET, Screen } from "@/ui/Screen";
import { FadeInView } from "@/ui/FadeInView";
import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { FLOATING_NAV_BAR } from "@/ui/floatingNavBar";
import { useTabBarAccessory } from "@/ui/tab-bar/tab-bar-accessory";
import { useTheme } from "@/theme";
import { prefersLightInk } from "@/utils/color/prefersLightInk";
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
import { PlanHero } from "../components/PlanHero";
import { usePlanHeroScroll } from "../hooks/use-plan-hero-scroll";
import { getPlanArtworkFrame } from "../logic/plan-artwork";
import { describePlanHero } from "../logic/plan-hero";
import { studyHref } from "../logic/routes";

/** Room at the bottom for the floating tab bar. */
const BOTTOM_NAV_CLEARANCE =
  FLOATING_NAV_BAR.capsuleHeight + FLOATING_NAV_BAR.bottomMargin + FLOATING_NAV_BAR.sideMargin;
/** The nav buttons sit this far below the status bar. */
const NAV_GAP = 8;
/** The nav buttons' height. */
const NAV_BUTTON = 49;

/**
 * Plan Detail, from the store, laid out the way Apple lays out a show: the
 * plan's hero flush to the top of the screen (`PlanHero`) — its sermon's
 * thumbnail below the nav buttons, held back as the page scrolls, and
 * where the plan stands, its title and church, Continue, and what the day
 * holds sliding up over it — then every day, done, open, or still locked. Back and
 * More float over it all, set for the sermon's colour.
 *
 * There's only ever one Continue: the hero's, until it's scrolled up level
 * with the nav buttons, when it hands over to the tab bar — which gathers
 * its tabs into one beside it — and back again scrolling down.
 *
 * Everything is read from the store on every render, so coming back shows
 * what's changed since.
 */
export function PlanOverviewScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isFocused = useIsFocused();
  const { width: screenWidth } = useWindowDimensions();
  const insetTop = useContext(SafeAreaInsetsContext)?.top ?? 0;
  const { planId = "" } = useLocalSearchParams<{ planId: string }>();
  const plan = useAppSelector((state) => getPlanById(state, planId));
  const sermon = useAppSelector((state) => getSermonForPlan(state, planId));
  const progress = useAppSelector((state) => getPlanProgress(state, planId));
  const currentDay = useAppSelector((state) => getCurrentPlanDay(state, planId));
  const days = useAppSelector((state) =>
    getPlanDays(state, planId).map((day) => ({ day, minutes: getDayMinutes(state, day.id) })),
  );

  const navTop = insetTop + NAV_GAP;
  const { onScroll, artworkStyle, continueStyle, onContinueLayout, handedOff } =
    usePlanHeroScroll(navTop);

  const currentMinutes = days.find(({ day }) => day.id === currentDay?.id)?.minutes ?? 0;
  const words =
    plan && progress && currentDay
      ? describePlanHero({
          status: plan.status,
          currentDay: currentDay.dayNumber,
          totalDays: progress.totalDays,
          dayTitle: currentDay.reading.title,
          minutes: currentMinutes,
        })
      : null;
  const openDay = (dayNumber: number) => router.push(studyHref(planId, dayNumber));
  const openCurrentDay = () => currentDay && openDay(currentDay.dayNumber);

  // Continue in the tab bar, once the hero's has scrolled up to the nav buttons.
  useTabBarAccessory(
    {
      label: words?.action ?? "",
      testID: "plan-overview-tab-bar-continue",
      icon: BookOpen,
      onPress: openCurrentDay,
    },
    handedOff && words !== null,
  );

  if (!plan || !progress) return null;
  const colors = sermon?.thumbnailColors ?? [];
  const light = prefersLightInk(colors.at(0) ?? theme.colors.featureBackdrop);

  return (
    <Screen testID="plan-overview-screen" edges={["left", "right"]}>
      {/* The page fades in as the screen appears, rather than jumping in. */}
      <FadeInView testID="plan-overview-content" style={styles.fill}>
        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {words && (
            <PlanHero
              title={plan.title}
              church={sermon?.church ?? null}
              thumbnailUrl={sermon?.thumbnailUrl ?? null}
              colors={colors}
              words={words}
              totalDays={progress.totalDays}
              completedDayCount={progress.completedDayCount}
              artwork={getPlanArtworkFrame({
                screenWidth,
                inset: PAGE_INSET,
                navBottom: navTop + NAV_BUTTON,
              })}
              artworkStyle={artworkStyle}
              continueStyle={continueStyle}
              continueShown={!handedOff}
              onContinueLayout={onContinueLayout}
              onContinue={openCurrentDay}
            />
          )}

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
        </Animated.ScrollView>
      </FadeInView>

      {/* Over everything, fixed: they never move as the page scrolls under them. */}
      <View pointerEvents="box-none" style={[styles.nav, { paddingTop: navTop }]}>
        <ScreenHeader
          testID="plan-overview"
          title=""
          left={
            <HeaderIconButton
              testID="plan-overview-back-button"
              icon={ArrowLeft}
              accessibilityLabel="Back"
              overlay={light ? "dark" : "light"}
              onPress={() => router.back()}
            />
          }
          right={
            <HeaderIconButton
              testID="plan-overview-more-button"
              icon={Ellipsis}
              accessibilityLabel="More"
              overlay={light ? "dark" : "light"}
              onPress={() => undefined}
            />
          }
        />
      </View>

      {/* Set for the sermon's colour — only while this is the screen shown. */}
      {isFocused && <StatusBar barStyle={light ? "light-content" : "dark-content"} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingBottom: BOTTOM_NAV_CLEARANCE },
  days: { gap: 12, paddingHorizontal: PAGE_INSET, paddingTop: 20 },
  nav: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: PAGE_INSET },
});
