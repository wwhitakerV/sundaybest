import { useContext } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useIsFocused, useLocalSearchParams, useRouter } from "expo-router";
import Animated from "react-native-reanimated";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { BookOpen } from "lucide-react-native";

import { PAGE_INSET, Screen } from "@/ui/organisms/Screen";
import { FLOATING_NAV_BAR_CLEARANCE } from "@/ui/organisms/floatingNavBar";
import { useTabBarAccessory } from "@/ui/organisms/tab-bar/tab-bar-accessory";
import { controlHeight, space, useTheme } from "@/theme";
import { prefersLightInk } from "@/utils/color/prefersLightInk";
import { tapFeedback } from "@/core/haptics/haptics";
import {
  getCurrentPlanDay,
  getDayMinutes,
  getPlanById,
  getPlanDays,
  getPlanProgress,
  getSermonForPlan,
  useAppSelector,
} from "@/core/store";
import { FadeInView } from "../components/FadeInView";
import { PlanAbout } from "../components/PlanAbout";
import { PlanHero } from "../components/PlanHero";
import { PlanJourney } from "../components/PlanJourney";
import { PlanNav } from "../components/PlanNav";
import { PlanStatusBar } from "../components/PlanStatusBar";
import { SelectedDay } from "../components/SelectedDay";
import { usePlanHeroScroll } from "../hooks/use-plan-hero-scroll";
import { useSelectedDay } from "../hooks/use-selected-day";
import { describeDayTile } from "../logic/day-rail";
import { getPlanArtworkFrame } from "../logic/plan-artwork";
import { describePlanHero } from "../logic/plan-hero";
import { quickCheckHref, studyHref } from "../logic/routes";

/** The nav buttons sit this far below the status bar. */
const NAV_GAP = space[8];
/** Placeholder until plans carry their own description. */
const ABOUT_PLACEHOLDER = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
  "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.",
  "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.",
] as const;
/** The nav buttons' height. */
const NAV_BUTTON = controlHeight.headerButton;

/**
 * Plan Detail, from the store, laid out the way Apple lays out a show: the
 * plan's hero flush to the top of the screen (`PlanHero`) — its sermon's
 * thumbnail below the nav buttons, held back as the page scrolls, and
 * where the plan stands, its title and church, Continue, and what the day
 * holds sliding up over it — then its days as a row of tiles (`DayRail`),
 * done, today, or locked — the one place that says which day's picked —
 * and the day picked as a study journey: its four steps, then its Quick
 * Check (`SelectedDay`); and what the plan's about. Back and More float over it
 * all, set for the sermon's colour.
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
  const { selectedNumber, pickDay, selected } = useSelectedDay({
    days,
    currentDayNumber: currentDay?.dayNumber ?? null,
    quickCheckEnabled: plan?.quickCheckEnabled ?? false,
  });

  const navTop = insetTop + NAV_GAP;
  const artwork = getPlanArtworkFrame({
    screenWidth,
    inset: PAGE_INSET,
    navBottom: navTop + NAV_BUTTON,
  });
  const {
    onScroll,
    heroMotion,
    handedOff,
    heroNavStyle,
    pageNavStyle,
    navOverPage,
    statusBarOverPage,
  } = usePlanHeroScroll({
    navTop,
    // The nav buttons' middle, and the status bar's.
    navLine: navTop + NAV_BUTTON / 2,
    statusBarLine: insetTop / 2,
  });

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
              plan={{
                title: plan.title,
                church: sermon?.church ?? null,
                thumbnailUrl: sermon?.thumbnailUrl ?? null,
                colors,
                words,
                totalDays: progress.totalDays,
                completedDayCount: progress.completedDayCount,
              }}
              artwork={artwork}
              motion={heroMotion}
              onContinue={openCurrentDay}
            />
          )}

          {/* Where you are at a glance, and what the day picked holds. */}
          <View style={styles.days}>
            <PlanJourney
              totalDays={progress.totalDays}
              tiles={days.map(({ day }) => describeDayTile(day, currentDay?.dayNumber ?? null))}
              selected={selectedNumber}
              onSelect={(dayNumber) => {
                tapFeedback();
                pickDay(dayNumber);
              }}
            />
            {selected && (
              <SelectedDay
                testID="plan-overview-selected-day"
                contentKey={selected.day.id}
                stepTestIDPrefix="plan-overview-step"
                title={selected.day.reading.title}
                header={selected.header}
                steps={selected.steps}
                quickCheck={selected.quickCheck}
                onOpenStep={(key) =>
                  key === "quickCheck"
                    ? router.push(quickCheckHref(planId, selected.day.dayNumber))
                    : openDay(selected.day.dayNumber)
                }
              />
            )}
          </View>

          <View style={styles.about}>
            <PlanAbout testID="plan-overview-about" paragraphs={ABOUT_PLACEHOLDER} />
          </View>
        </Animated.ScrollView>
      </FadeInView>

      {/* Over everything. Two looks — set for the sermon's colour over the
      hero, and the page's own over the page — cross-fading as the hero's edge
      passes behind them. */}
      <PlanNav
        testIDs={{
          root: "plan-overview-nav-hero",
          header: "plan-overview",
          back: "plan-overview-back-button",
          more: "plan-overview-more-button",
        }}
        shown={!navOverPage}
        overlay={light ? "dark" : "light"}
        top={navTop}
        style={heroNavStyle}
        onBack={() => router.back()}
      />
      <PlanNav
        testIDs={{
          root: "plan-overview-nav-page",
          header: "plan-overview-page",
          back: "plan-overview-back-button-page",
          more: "plan-overview-more-button-page",
        }}
        shown={navOverPage}
        top={navTop}
        style={pageNavStyle}
        onBack={() => router.back()}
      />

      {/* Only while this is the screen shown. */}
      {isFocused && <PlanStatusBar overPage={statusBarOverPage} light={light} />}
    </Screen>
  );
}

/** Between the row of days and the selected day below it. */
const DAYS_GAP = 30;
/** The About section sits well clear of the day above it. */
const ABOUT_TOP = 48;

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingBottom: FLOATING_NAV_BAR_CLEARANCE },
  // Room around the row of days, so it reads as its own layer: where you are.
  days: { gap: DAYS_GAP, paddingHorizontal: PAGE_INSET, paddingTop: space[36] },
  about: { paddingHorizontal: PAGE_INSET, paddingTop: ABOUT_TOP },
});
