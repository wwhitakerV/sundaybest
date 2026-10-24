import { useState } from "react";
import { StyleSheet, View, useWindowDimensions, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { Search } from "lucide-react-native";

import { FEATURE_ARTWORK_RADIUS } from "@/entities/plan";
import { space } from "@/theme";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { RoundedEdge } from "@/ui/atoms/RoundedEdge";
import { PageDots } from "@/ui/molecules/PageDots";
import { TitleHeader } from "@/ui/molecules/TitleHeader";
import { ScreenLoadError } from "@/ui/organisms/ScreenLoadError";
import { ScrollFrame } from "@/ui/organisms/ScrollFrame";
import { PAGE_INSET, PAGE_TOP } from "@/ui/organisms/Screen";
import { PlanPage } from "../components/PlanPage";
import { PlanPageSkeleton } from "../components/PlanPageSkeleton";
import { PlansEmpty } from "../components/PlansEmpty";
import { usePlansPager } from "../hooks/use-plans-pager";

/**
 * The Plans tab: a stack of full-screen pages, one plan to each — thrown
 * through with iOS's own momentum, as far as the finger flings it, settling
 * on a whole page; one plan's whole page in view (`PlanPage`). A finger on a
 * plan's days holds the plans still. Over them all, the tab's header, fixed:
 * "Plans", the dots saying which plan's in view (`PageDots`), and, from two
 * plans, the search at the right. Loading, its first page's shape; with no
 * plans, what fills it.
 */
export function PlansScreen() {
  const view = usePlansPager();
  const { width } = useWindowDimensions();
  const insetTop = useSafeAreaInsets().top;
  // The room the pages have under the header: each page is given it, as a sideways pager won't.
  const [pagerHeight, setPagerHeight] = useState(0);
  const [touchingDays, setTouchingDays] = useState(false);
  // Where the pages are, in pages: what the dots follow.
  const position = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    position.value = width > 0 ? event.contentOffset.x / width : 0;
  });
  const { setInView } = view;
  useAnimatedReaction(
    () => Math.round(position.value),
    (now, before) => {
      if (now !== before) runOnJS(setInView)(now);
    },
  );

  if (view.error) {
    return (
      <ScreenLoadError testID="plans-load-error" title="Couldn't load Plans" onRetry={view.retry} />
    );
  }

  const count = view.planIds.length;
  const header = (
    <TitleHeader
      title="Plans"
      centre={
        count > 1 && (
          <PageDots
            testID="plans-dots"
            count={count}
            position={position}
            accessibilityLabel={`Plan ${view.inView + 1} of ${count}`}
          />
        )
      }
      actions={
        view.searchable && (
          <HeaderIconButton
            testID="plans-search-button"
            icon={Search}
            accessibilityLabel="Search plans"
            onPress={view.openSearch}
          />
        )
      }
    />
  );

  const content = view.loading ? (
    <View style={styles.under}>
      <PlanPageSkeleton testID="plans-content-pending" />
    </View>
  ) : count === 0 ? (
    <View style={styles.under}>
      <PlansEmpty testID="plans-empty" {...view.empty} />
    </View>
  ) : (
    pagerHeight > 0 && (
      <Animated.FlatList
        testID="plans-pager"
        horizontal
        data={view.planIds}
        keyExtractor={(planId) => planId}
        renderItem={({ item, index }) => (
          <PlanPage
            planId={item}
            width={width}
            height={pagerHeight}
            inView={index === view.inView}
            openDrawers={view.openDrawers}
            onToggleDrawer={view.toggleDrawer}
            onTouchingDays={setTouchingDays}
          />
        )}
        extraData={view.inView}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onScroll={onScroll}
        scrollEventThrottle={16}
        // iOS's own throw: as far as the finger flings it, coming to rest on a whole page.
        snapToInterval={width}
        snapToAlignment="start"
        decelerationRate="normal"
        disableIntervalMomentum={false}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!touchingDays}
        // Only the page in view and its neighbours are drawn; the rest wait.
        windowSize={3}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
      />
    )
  );

  // The header holds still on the page's solid colour, nothing ever behind it and no fade
  // under it; the pages start at its foot, rounding into it along the artwork's corners.
  return (
    <ScrollFrame testID="plans-screen" topEdge="none">
      <View style={[styles.fill, { paddingTop: insetTop }]}>
        <View testID="plans-header" style={styles.bar}>
          {header}
        </View>
        <View
          style={styles.fill}
          onLayout={(event: LayoutChangeEvent) => setPagerHeight(event.nativeEvent.layout.height)}
        >
          {content}
          <RoundedEdge
            testID="plans-rounded-edge"
            radius={FEATURE_ARTWORK_RADIUS}
            inset={PAGE_INSET}
            top={0}
          />
        </View>
      </View>
    </ScrollFrame>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  bar: { paddingHorizontal: PAGE_INSET, paddingTop: PAGE_TOP, paddingBottom: space[8] },
  // Before there are pages: what fills the tab, set where a page's artwork would start.
  under: { flex: 1, paddingHorizontal: PAGE_INSET, paddingTop: space[8] },
});
