import { useContext, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { space, useTheme } from "@/theme";
import { RoundedEdge } from "../atoms/RoundedEdge";
import type { ListParts, ListScreenProps } from "./ListScreen";
import { ListGap } from "./ListGap";
import { SCROLL_INSET, useFrameClearance } from "./ScrollFrame";
import { SCROLL_THROTTLE_MS } from "./list-scroll";
import { PAGE_INSET } from "./Screen";

/** FlashList, its scroll followed on the UI thread (the bar's pull-down). */
const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

/**
 * `ListScreen`'s list under a bar (`pinned`), held above it under the status
 * bar — so nothing ever scrolls behind either — on the page's solid colour
 * edge to edge. Pulled down past the top, the bar comes down with the list.
 */
export function PinnedList<Item>({
  testID,
  data,
  renderItem,
  keyExtractor,
  itemType,
  empty,
  gap,
  contentStyle,
  onScroll,
  keyboardDismissMode,
  pinned,
}: ListParts<Item> & { pinned: NonNullable<ListScreenProps<Item>["pinned"]> }) {
  const theme = useTheme();
  const clearance = useFrameClearance();
  const insetTop = useContext(SafeAreaInsetsContext)?.top ?? 0;
  // The bar's height: where its foot is, for the rounded edge laid over the list there.
  const [barHeight, setBarHeight] = useState(0);
  // Pulled down past the top, the bar and its edge come down with the list, never over it.
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
    if (onScroll) runOnJS(onScroll)(event.contentOffset.y);
  });
  const pulledStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.max(-scrollY.get(), 0) }],
  }));

  return (
    <View style={[styles.list, { marginTop: insetTop }]}>
      <Animated.View
        testID={`${testID}-pinned-bar`}
        style={[styles.bar, { backgroundColor: theme.colors.background }, pulledStyle]}
        onLayout={(event: LayoutChangeEvent) => setBarHeight(event.nativeEvent.layout.height)}
      >
        {pinned.bar}
      </Animated.View>
      <AnimatedFlashList
        testID={testID}
        {...(keyboardDismissMode && { keyboardDismissMode })}
        onScroll={scrollHandler}
        scrollEventThrottle={SCROLL_THROTTLE_MS}
        style={styles.list}
        data={data}
        // Reanimated's wrapper drops FlashList's item type; these are the list's own, unchanged.
        renderItem={renderItem as ListRenderItem<unknown>}
        keyExtractor={keyExtractor as (item: unknown) => string}
        {...(itemType && { getItemType: itemType as (item: unknown) => string })}
        contentContainerStyle={[SCROLL_INSET, contentStyle]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <ListGap testID={testID} size={gap} />}
        ListHeaderComponent={<ListGap testID={testID} size={gap} />}
        ListFooterComponent={
          <>
            {data.length > 0 ? <ListGap testID={testID} size={gap} /> : empty}
            <View testID={`${testID}-bottom-clearance`} style={{ height: clearance.bottom }} />
          </>
        }
      />
      {pinned.rounded !== undefined && barHeight > 0 && (
        <Animated.View pointerEvents="none" style={[styles.edge, { top: barHeight }, pulledStyle]}>
          <RoundedEdge
            testID={`${testID}-rounded-edge`}
            radius={pinned.rounded}
            inset={PAGE_INSET}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  // The rounded edge's place: at the bar's foot, across the full width.
  edge: { position: "absolute", left: 0, right: 0 },
  // Over the list's top, so pulled down it stays in front of what it comes down onto.
  bar: { zIndex: 1, paddingHorizontal: PAGE_INSET, paddingVertical: space[12] },
});
