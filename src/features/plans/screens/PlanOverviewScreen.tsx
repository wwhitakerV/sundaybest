import { useContext } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useIsFocused } from "expo-router";
import Animated from "react-native-reanimated";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { BookOpen } from "lucide-react-native";

import { NotFoundScreen } from "@/ui/organisms/NotFoundScreen";
import { ScreenLoadError } from "@/ui/organisms/ScreenLoadError";
import { PAGE_INSET, Screen } from "@/ui/organisms/Screen";
import { FLOATING_NAV_BAR_CLEARANCE } from "@/ui/organisms/floatingNavBar";
import { useTabBarAccessory } from "@/ui/organisms/tab-bar/tab-bar-accessory";
import { controlHeight, space } from "@/theme";
import { FadeInView } from "../components/FadeInView";
import { PlanAbout } from "../components/PlanAbout";
import { PlanHero } from "../components/PlanHero";
import { PlanJourney } from "../components/PlanJourney";
import { PlanMoreMenu } from "../components/PlanMoreMenu";
import { PlanNav } from "../components/PlanNav";
import { PlanOverviewPending } from "../components/PlanOverviewPending";
import { PlanStatusBar } from "../components/PlanStatusBar";
import { SelectedDay } from "../components/SelectedDay";
import { usePlanHeroScroll } from "../hooks/use-plan-hero-scroll";
import { usePlanOverview } from "../hooks/use-plan-overview";
import { getPlanArtworkFrame } from "../logic/plan-artwork";

const NAV_GAP = space[8];

const NAV_BUTTON = controlHeight.headerButton;
const MENU_GAP = space[8];

export function PlanOverviewScreen() {
  const view = usePlanOverview();
  const isFocused = useIsFocused();
  const { width: screenWidth } = useWindowDimensions();
  const insetTop = useContext(SafeAreaInsetsContext)?.top ?? 0;

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
    navLine: navTop + NAV_BUTTON / 2,
    statusBarLine: insetTop / 2,
  });

  useTabBarAccessory(
    {
      label: view.continueLabel ?? "",
      testID: "plan-overview-tab-bar-continue",
      icon: BookOpen,
      onPress: view.openCurrentDay,
    },
    handedOff && view.continueLabel !== null,
  );

  if (!view.found && view.loading) {
    return <PlanOverviewPending navTop={navTop} onBack={view.goBack} />;
  }

  if (!view.found && view.error) {
    return (
      <ScreenLoadError
        testID="plan-overview-load-error"
        title="Couldn't load this plan"
        onRetry={view.retry}
        leave={{ label: "Back to Plans", onPress: view.goBack }}
      />
    );
  }

  if (!view.found) {
    return (
      <NotFoundScreen
        testID="plan-overview-not-found"
        title="This plan isn't here"
        message="It may have been removed, or the link is out of date."
        actionLabel="Back to Plans"
        onAction={view.goBack}
      />
    );
  }

  const { light } = view;

  return (
    <Screen testID="plan-overview-screen" edges={["left", "right"]}>
      <FadeInView testID="plan-overview-content" style={styles.fill}>
        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {view.hero && (
            <PlanHero
              plan={view.hero}
              artwork={artwork}
              motion={heroMotion}
              onContinue={view.openCurrentDay}
            />
          )}

          <View style={styles.days}>
            <PlanJourney
              totalDays={view.totalDays}
              tiles={view.tiles}
              selected={view.selectedNumber}
              onSelect={view.pickDay}
            />

            {view.selected && (
              <SelectedDay
                testID="plan-overview-selected-day"
                contentKey={view.selected.day.id}
                stepTestIDPrefix="plan-overview-step"
                title={view.selected.day.reading.title}
                header={view.selected.header}
                steps={view.selected.steps}
                quickCheck={view.selected.quickCheck}
                onOpenStep={view.openStep}
              />
            )}
          </View>

          {view.about && (
            <View style={styles.about}>
              <PlanAbout testID="plan-overview-about" {...view.about} />
            </View>
          )}
        </Animated.ScrollView>
      </FadeInView>

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
        onBack={view.goBack}
        onMore={view.more.show}
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
        onBack={view.goBack}
        onMore={view.more.show}
      />

      <PlanMoreMenu
        open={view.more.open}
        onClose={view.more.close}
        saved={view.more.saved}
        items={view.more.items}
        anchor={{
          top: navTop + NAV_BUTTON + MENU_GAP,
          right: PAGE_INSET,
        }}
      />

      {isFocused && <PlanStatusBar overPage={statusBarOverPage} light={light} />}
    </Screen>
  );
}

const DAYS_GAP = 30;
const ABOUT_TOP = 48;

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },

  content: {
    paddingBottom: FLOATING_NAV_BAR_CLEARANCE,
  },

  days: {
    gap: DAYS_GAP,
    paddingHorizontal: PAGE_INSET,
    paddingTop: space[36],
  },

  about: {
    paddingHorizontal: PAGE_INSET,
    paddingTop: ABOUT_TOP,
  },
});
