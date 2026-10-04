import { StatusBar, StyleSheet, View } from "react-native";
import { useIsFocused } from "expo-router";
import Animated from "react-native-reanimated";

import { PAGE_INSET, Screen } from "@/ui/organisms/Screen";
import { ScreenLoadError } from "@/ui/organisms/ScreenLoadError";
import { ContentPending } from "@/ui/molecules/ContentPending";
import { FLOATING_NAV_BAR_CLEARANCE } from "@/ui/organisms/floatingNavBar";
import { ActivePlanBar } from "../components/ActivePlanBar";
import { ActivePlanHero } from "../components/ActivePlanHero";
import { ArtworkFlight } from "../components/ArtworkFlight";
import { useHomeView } from "../hooks/use-home-view";
import { CONTENT_TOP, useHeroCollapse } from "../hooks/use-hero-collapse";
import { PlanList } from "../components/PlanList";
import { PlanRow } from "../components/PlanRow";
import { StartHereCard } from "../components/StartHereCard";
import { controlHeight, space } from "@/theme";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SFProBody } from "@/ui/typography/SFProBody";
import { Wordmark } from "@/ui/typography/Wordmark";

/** A header action's 44pt tap target — the masthead row keeps it. */
const HEADER_HEIGHT = controlHeight.hitTarget;

/**
 * Home, from the API plan cache. With a plan under way: that plan featured up top,
 * full width in its sermon's colour (`ActivePlanHero`) — where it stands,
 * Continue straight into today's study, and its artwork zooming open into
 * Plan Detail — then all the user's server-backed plans. Scrolling up, the header fades
 * and the featured plan collapses into a plan bar pinned at the top
 * (`useHeroCollapse`), reversing on the way back. With
 * none: a card to add a sermon, and the sample to try (or their other plans,
 * if they have some waiting). The tab bar's + also starts a new plan.
 */
export function HomeScreen() {
  const view = useHomeView();
  const isFocused = useIsFocused();
  const {
    insetTop,
    snapOffsets,
    onContentSizeChange,
    onScroll,
    onHeaderLayout,
    onScrollLayout,
    headerStyle,
    heroMotion,
    barMotion,
    flightStyle,
    phase,
  } = useHeroCollapse();

  if (view.error) {
    return (
      <ScreenLoadError testID="home-load-error" title="Couldn't load Home" onRetry={view.retry} />
    );
  }

  return (
    <View style={styles.root}>
      <Screen testID="home-tab-screen" padded="vertical">
        <Animated.View
          testID="home-tab-header"
          onLayout={onHeaderLayout}
          pointerEvents={phase.headerTouchable ? "auto" : "none"}
          style={[styles.header, headerStyle]}
        >
          <Wordmark />
          <MonoLabel variant="headerDate" tone="textMuted" testID="home-tab-date" numberOfLines={1}>
            {view.date}
          </MonoLabel>
        </Animated.View>

        <Animated.ScrollView
          testID="home-tab-scroll"
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
          {view.loading ? (
            <ContentPending testID="home-content-pending" />
          ) : (
            <>
              {view.active ? (
                <ActivePlanHero
                  plan={view.active.hero}
                  href={view.active.href}
                  onContinue={view.continueToday}
                  motion={heroMotion}
                />
              ) : (
                <StartHereCard onAddSermon={view.addSermon} />
              )}

              {view.hasPlans ? (
                <PlanList plans={view.plans} onOpenPlan={view.openPlan} />
              ) : (
                view.sample && (
                  <View style={styles.sample}>
                    <SFProBody tone="textMuted" style={styles.label}>
                      Try a sample
                    </SFProBody>

                    <PlanRow
                      testID="home-tab-sample-plan"
                      title={view.sample.title}
                      detail={view.sample.detail}
                      done={false}
                      onPress={view.openSample}
                    />
                  </View>
                )
              )}
            </>
          )}
        </Animated.ScrollView>
      </Screen>

      {!view.loading && view.active && (
        <ActivePlanBar
          plan={view.active.bar}
          topInset={insetTop}
          motion={barMotion}
          href={view.active.href}
          onContinue={view.continueToday}
        />
      )}

      {!view.loading && view.flight && (
        <ArtworkFlight thumbnailUrl={view.flight.thumbnailUrl} style={flightStyle} />
      )}

      {isFocused && !view.loading && phase.lightStatusBar && <StatusBar barStyle="light-content" />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    minHeight: HEADER_HEIGHT,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: PAGE_INSET,
  },

  scroll: {
    flex: 1,
    overflow: "visible",
  },

  content: {
    gap: space[28],
    paddingHorizontal: PAGE_INSET,
    paddingTop: CONTENT_TOP,
    paddingBottom: FLOATING_NAV_BAR_CLEARANCE,
  },

  sample: {
    gap: space[12],
  },

  label: {
    marginLeft: space[6],
  },
});
