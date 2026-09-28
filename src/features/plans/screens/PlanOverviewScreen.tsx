import { useContext, useState } from "react";
import { StatusBar, StyleSheet, Text, View, useWindowDimensions } from "react-native";
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
import { tapFeedback } from "@/core/haptics/haptics";
import {
  getCurrentPlanDay,
  getDayMinutes,
  getDayScripture,
  getPlanById,
  getPlanDays,
  getPlanProgress,
  getAttemptAnswers,
  getQuizAttempt,
  getQuizForDay,
  getQuizQuestions,
  getQuizScore,
  getQuizStatus,
  getReflectionsForDay,
  getSermonForPlan,
  useAppSelector,
  type AppState,
} from "@/core/store";
import { PlanAbout } from "../components/PlanAbout";
import { DayRail } from "../components/DayRail";
import { PlanHero } from "../components/PlanHero";
import { SelectedDay } from "../components/SelectedDay";
import { usePlanHeroScroll } from "../hooks/use-plan-hero-scroll";
import {
  describeDayHeader,
  describeDaySteps,
  describeDayTile,
  describeQuickCheckStep,
  getJourneyLabel,
  type QuickCheckStanding,
} from "../logic/day-rail";
import { getPlanArtworkFrame } from "../logic/plan-artwork";
import { describePlanHero } from "../logic/plan-hero";
import { quickCheckHref, studyHref } from "../logic/routes";

/** Room at the bottom for the floating tab bar. */
const BOTTOM_NAV_CLEARANCE =
  FLOATING_NAV_BAR.capsuleHeight + FLOATING_NAV_BAR.bottomMargin + FLOATING_NAV_BAR.sideMargin;
/** The nav buttons sit this far below the status bar. */
const NAV_GAP = 8;
/** Placeholder until plans carry their own description. */
const ABOUT_PLACEHOLDER = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
  "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.",
  "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.",
] as const;
/** The nav buttons' height. */
const NAV_BUTTON = 49;

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
  // The day picked in the row of days: the one the plan's on, until another's tapped.
  const [pickedDay, setPickedDay] = useState<number | null>(null);
  const selectedNumber = pickedDay ?? currentDay?.dayNumber ?? 1;
  const selected = days.find(({ day }) => day.dayNumber === selectedNumber) ?? null;
  const selectedDay = selected?.day ?? null;
  const selectedMinutes = selected?.minutes ?? 0;
  const selectedToday =
    selectedDay !== null && describeDayTile(selectedDay, currentDay?.dayNumber ?? null).today;
  const selectedContent = useAppSelector((state) =>
    selectedDay
      ? {
          readingTitle: selectedDay.reading.title,
          scriptureReference: getDayScripture(state, selectedDay.id)?.reference ?? null,
          reflectionCount: getReflectionsForDay(state, selectedDay.id).length,
          quiz: getQuickCheckStanding(state, selectedDay.id),
        }
      : null,
  );

  const navTop = insetTop + NAV_GAP;
  const artwork = getPlanArtworkFrame({
    screenWidth,
    inset: PAGE_INSET,
    navBottom: navTop + NAV_BUTTON,
  });
  const {
    onScroll,
    artworkStyle,
    continueStyle,
    colourStyle,
    onContinueLayout,
    onHeroLayout,
    heroHeight,
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
  // The day picked's four study steps, and — apart from them — its Quick Check if it has one.
  const selectedSteps =
    selectedDay && selectedContent
      ? describeDaySteps(selectedDay, selectedContent, { today: selectedToday })
      : null;
  const quickCheck =
    selectedDay && selectedContent
      ? describeQuickCheckStep(selectedDay, plan.quickCheckEnabled ? selectedContent.quiz : null)
      : null;
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
              artwork={artwork}
              artworkStyle={artworkStyle}
              continueStyle={continueStyle}
              continueShown={!handedOff}
              onContinueLayout={onContinueLayout}
              onContinue={openCurrentDay}
              heroHeight={heroHeight}
              onHeroLayout={onHeroLayout}
              colourStyle={colourStyle}
            />
          )}

          {/* Where you are at a glance, and what the day picked holds. */}
          <View style={styles.days}>
            <View style={styles.journey}>
              <Text
                testID="plan-overview-journey"
                style={[
                  theme.typography.metaLabel,
                  styles.journeyLabel,
                  { color: theme.colors.textMuted },
                ]}
              >
                {getJourneyLabel(progress.totalDays)}
              </Text>
              <DayRail
                testID="plan-overview-days"
                tileTestIDPrefix="plan-overview-day"
                tiles={days.map(({ day }) => describeDayTile(day, currentDay?.dayNumber ?? null))}
                selected={selectedNumber}
                onSelect={(dayNumber) => {
                  tapFeedback();
                  setPickedDay(dayNumber);
                }}
              />
            </View>
            {selectedDay && selectedSteps && (
              <SelectedDay
                testID="plan-overview-selected-day"
                contentKey={selectedDay.id}
                stepTestIDPrefix="plan-overview-step"
                title={selectedDay.reading.title}
                header={describeDayHeader(selectedDay, {
                  minutes: selectedMinutes,
                  steps: selectedSteps,
                })}
                steps={selectedSteps}
                quickCheck={quickCheck}
                onOpenStep={(key) =>
                  key === "quickCheck"
                    ? router.push(quickCheckHref(planId, selectedDay.dayNumber))
                    : openDay(selectedDay.dayNumber)
                }
              />
            )}
          </View>

          <View style={styles.about}>
            <PlanAbout testID="plan-overview-about" paragraphs={ABOUT_PLACEHOLDER} />
          </View>
        </Animated.ScrollView>
      </FadeInView>

      {/* Over everything, fixed: they never move as the page scrolls under them.
      Two looks — set for the sermon's colour over the hero, and the page's own
      over the page — cross-fading as the hero's edge passes behind them. Only
      the one showing takes touches, or is read by VoiceOver. */}
      <Animated.View
        testID="plan-overview-nav-hero"
        pointerEvents={navOverPage ? "none" : "box-none"}
        accessibilityElementsHidden={navOverPage}
        importantForAccessibility={navOverPage ? "no-hide-descendants" : "auto"}
        style={[styles.nav, { paddingTop: navTop }, heroNavStyle]}
      >
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
      </Animated.View>
      <Animated.View
        testID="plan-overview-nav-page"
        pointerEvents={navOverPage ? "box-none" : "none"}
        accessibilityElementsHidden={!navOverPage}
        importantForAccessibility={navOverPage ? "auto" : "no-hide-descendants"}
        style={[styles.nav, { paddingTop: navTop }, pageNavStyle]}
      >
        <ScreenHeader
          testID="plan-overview-page"
          title=""
          left={
            <HeaderIconButton
              testID="plan-overview-back-button-page"
              icon={ArrowLeft}
              accessibilityLabel="Back"
              onPress={() => router.back()}
            />
          }
          right={
            <HeaderIconButton
              testID="plan-overview-more-button-page"
              icon={Ellipsis}
              accessibilityLabel="More"
              onPress={() => undefined}
            />
          }
        />
      </Animated.View>

      {/* Set for what's under it — the sermon's colour, or the page — only
      while this is the screen shown. */}
      {isFocused && (
        <StatusBar
          animated
          barStyle={
            statusBarOverPage
              ? theme.name === "dark"
                ? "light-content"
                : "dark-content"
              : light
                ? "light-content"
                : "dark-content"
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingBottom: BOTTOM_NAV_CLEARANCE },
  // Room around the row of days, so it reads as its own layer: where you are.
  days: { gap: 30, paddingHorizontal: PAGE_INSET, paddingTop: 36 },
  // The row of days under its heading.
  journey: { gap: 14 },
  journeyLabel: { textTransform: "uppercase", letterSpacing: 1 },
  about: { paddingHorizontal: PAGE_INSET, paddingTop: 48 },
  nav: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: PAGE_INSET },
});

/** Where a day's Quick Check stands — none if it hasn't one. */
function getQuickCheckStanding(state: AppState, dayId: string): QuickCheckStanding | null {
  const quiz = getQuizForDay(state, dayId);
  if (!quiz) return null;
  const attempt = getQuizAttempt(state, quiz.id);
  return {
    status: getQuizStatus(state, quiz.id),
    questionCount: getQuizQuestions(state, quiz.id).length,
    answeredCount: attempt ? getAttemptAnswers(state, attempt.id).length : 0,
    correctCount: attempt ? (getQuizScore(state, attempt.id)?.correct ?? 0) : 0,
  };
}
