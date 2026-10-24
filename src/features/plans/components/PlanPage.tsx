import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { BookOpen, Lock, RotateCcw } from "lucide-react-native";

import { PlanFeature } from "@/entities/plan";
import { space } from "@/theme";
import { Button } from "@/ui/atoms/Button";
import { SkeletonHandoff } from "@/ui/molecules/SkeletonHandoff";
import { useFrameClearance } from "@/ui/organisms/ScrollFrame";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { useHideTabBarFab, useTabBarAccessory } from "@/ui/organisms/tab-bar/tab-bar-accessory";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import { useContinueHandOver } from "../hooks/use-continue-hand-over";
import { usePlanDetail } from "../hooks/use-plan-detail";
import { DayCarousel } from "./DayCarousel";
import { PlanDrawers, type PlanDrawerKey } from "./PlanDrawers";
import { PlanPageSkeleton } from "./PlanPageSkeleton";

/** The room between the header's foot, where each page starts, and its artwork. */
const PAGE_TOP_ROOM = space[8];

export type PlanPageProps = {
  planId: string;
  /** The page's size: the screen's, one plan to a page — a sideways pager doesn't stretch its pages. */
  width: number;
  height: number;
  /** Whether it's the plan in view: only that one's Continue goes to the tab bar. */
  inView: boolean;
  /** The drawers open — the same on every page as the plans turn. */
  openDrawers: ReadonlySet<PlanDrawerKey>;
  onToggleDrawer: (key: PlanDrawerKey) => void;
  /** A finger on its days, and off: the plans don't turn while one is. */
  onTouchingDays: (touching: boolean) => void;
};

/**
 * One plan, its whole page on the Plans tab — scrolled up and down on its
 * own, its top rounding into the tab's header: the plan featured as Home features one
 * (`PlanFeature`), its days, always in view, swiped through, and its drawers.
 * From here the only way on is into a day's study. Scrolled up under the
 * header, its Continue fades and the tab bar takes it, as Plan Overview's
 * does — while it's the plan in view. While it loads, its skeleton; if it
 * can't, a quiet line and Try again — the other plans a swipe away.
 */
export function PlanPage({
  planId,
  width,
  height,
  inView,
  openDrawers,
  onToggleDrawer,
  onTouchingDays,
}: PlanPageProps) {
  const plan = usePlanDetail(planId);
  const clearance = useFrameClearance();
  const scrolled = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrolled.value = event.contentOffset.y;
  });
  // The page starts at the header's foot: Continue hands over as it scrolls up to it.
  const { handedOff, continueHandOver } = useContinueHandOver(scrolled, 0, PAGE_TOP_ROOM);
  const continueLabel = plan.continueLabel;
  const handOver = inView && handedOff && continueLabel !== null;
  useTabBarAccessory(
    {
      label: continueLabel ?? "",
      testID: "plans-tab-bar-continue",
      icon: plan.continueWaiting ? Lock : BookOpen,
      waiting: plan.continueWaiting,
      onPress: plan.openCurrentDay,
    },
    handOver,
  );
  // Continue takes the floating button's place while it's down there.
  useHideTabBarFab(handOver);

  return (
    <Animated.ScrollView
      testID={`plan-page-${planId}`}
      style={{ width, height }}
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.page,
        { paddingTop: PAGE_TOP_ROOM, paddingBottom: clearance.bottom },
      ]}
    >
      <SkeletonHandoff
        testID={`plan-page-${planId}-handoff`}
        pending={!plan.found && plan.loading}
        skeleton={<PlanPageSkeleton testID={`plan-page-${planId}-pending`} />}
        style={styles.parts}
      >
        {plan.found && plan.feature ? (
          <>
            <PlanFeature
              plan={plan.feature}
              onContinue={plan.openCurrentDay}
              action={continueHandOver}
              testIDs={{
                root: `plan-page-${planId}-feature`,
                title: `plan-page-${planId}-title`,
                standing: `plan-page-${planId}-standing`,
                today: `plan-page-${planId}-today`,
                action: `plan-page-${planId}-continue`,
              }}
            />
            <View style={styles.bleed}>
              <DayCarousel
                testID={`plan-page-${planId}-days`}
                days={plan.dayCards}
                currentDayNumber={plan.selectedNumber}
                onOpenDay={plan.openDay}
                onTouching={onTouchingDays}
              />
            </View>
            <PlanDrawers
              testID={`plan-page-${planId}-drawers`}
              about={plan.about}
              settings={plan.more.items}
              open={openDrawers}
              onToggle={onToggleDrawer}
            />
          </>
        ) : (
          <PlanPageError testID={`plan-page-${planId}-retry`} onRetry={plan.retry} />
        )}
      </SkeletonHandoff>
    </Animated.ScrollView>
  );
}

/** A plan that couldn't be loaded: a quiet line, and Try again. */
function PlanPageError({ testID, onRetry }: { testID: string; onRetry: () => void }) {
  return (
    <View style={styles.missing}>
      <View style={styles.missingWords}>
        <SFProTitle variant="message">{"Couldn't load this plan"}</SFProTitle>
        <SFProBody tone="textMuted">Check your connection and try again.</SFProBody>
      </View>
      <Button testID={testID} label="Try again" icon={RotateCcw} variant="soft" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: PAGE_INSET },
  parts: { gap: space[32] },
  // The days run to the screen's edges, their first card set at the page's inset.
  bleed: { marginHorizontal: -PAGE_INSET },
  missing: { gap: space[24], paddingTop: space[40] },
  missingWords: { gap: space[8] },
});
