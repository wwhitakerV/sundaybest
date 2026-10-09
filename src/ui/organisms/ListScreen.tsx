import { useContext, useState, type ReactElement, type ReactNode } from "react";
import {
  FlatList,
  StyleSheet,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  View,
  type ListRenderItem,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { space, useTheme } from "@/theme";
import { RoundedEdge } from "../atoms/RoundedEdge";
import { SCROLL_INSET, ScrollFrame, useFrameClearance, type ScrollFrameProps } from "./ScrollFrame";
import { PAGE_INSET, PAGE_TOP } from "./Screen";

export type ListScreenProps<Item> = Omit<ScrollFrameProps, "children"> & {
  data: readonly Item[];
  renderItem: ListRenderItem<Item>;
  keyExtractor: (item: Item) => string;
  /** Shown in place of the list when it's empty. */
  empty?: ReactElement;
  /** Layout extras for the list's content (gaps, room at its foot). Never its sides. */
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * In place of a floating header: a `bar` (Plans' header) that stays pinned
   * under the status bar on the page's own solid colour — no fade, nothing
   * showing behind it — with, if given, a `title` above it that scrolls away
   * with the list.
   */
  pinned?: {
    title?: ReactNode;
    bar: ReactNode;
    /**
     * The list's top rounds into the bar along this radius (the cards'), as
     * through a window, rather than being cut straight (Plans).
     */
    rounded?: number;
  };
  /** How far down it's scrolled, as it scrolls — for a header that changes with it (Plans'). */
  onScroll?: (y: number) => void;
};

/** Scroll events often enough to follow a finger, about once a frame. */
const SCROLL_THROTTLE_MS = 16;

/** The list's scroll handler, when the page wants one. */
const scrollProps = (onScroll?: (y: number) => void) =>
  onScroll
    ? {
        scrollEventThrottle: SCROLL_THROTTLE_MS,
        onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) =>
          onScroll(event.nativeEvent.contentOffset.y),
      }
    : {};

/**
 * `ScrollScreen` for a list of items, drawn as they scroll into view: the
 * list runs the screen's full width, the page inset on its content and on
 * the header and footer (`ScrollFrame`).
 */
export function ListScreen<Item>({
  data,
  renderItem,
  keyExtractor,
  empty,
  contentStyle,
  pinned,
  onScroll,
  ...frame
}: ListScreenProps<Item>) {
  const list = {
    ...(onScroll && { onScroll }),
    testID: `${frame.testID}-list`,
    data,
    renderItem,
    keyExtractor,
    ...(empty && { empty }),
    ...(contentStyle && { contentStyle }),
  };

  if (pinned) {
    return (
      <ScrollFrame {...frame} topEdge="none">
        <PinnedList {...list} pinned={pinned} />
      </ScrollFrame>
    );
  }
  return (
    <ScrollFrame {...frame}>
      <ClearedList {...list} />
    </ScrollFrame>
  );
}

type ListParts<Item> = Pick<
  ListScreenProps<Item>,
  "data" | "renderItem" | "keyExtractor" | "empty" | "contentStyle" | "onScroll"
> & { testID: string };

/** The list itself, its items resting clear of the frame's header, dock, and fades. */
function ClearedList<Item>({
  testID,
  data,
  renderItem,
  keyExtractor,
  empty,
  contentStyle,
  onScroll,
}: ListParts<Item>) {
  const clearance = useFrameClearance();

  return (
    <FlatList
      testID={testID}
      {...scrollProps(onScroll)}
      style={styles.list}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={[SCROLL_INSET, contentStyle]}
      showsVerticalScrollIndicator={false}
      {...(empty && { ListEmptyComponent: empty })}
      ListHeaderComponent={
        <View testID={`${testID}-top-clearance`} style={{ height: clearance.top }} />
      }
      ListFooterComponent={
        <View testID={`${testID}-bottom-clearance`} style={{ height: clearance.bottom }} />
      }
    />
  );
}

/** The row the pinned bar takes in the list: the first after the title. */
const BAR = Symbol("bar");

/**
 * A list that starts under the status bar — so nothing ever scrolls behind
 * it — with its bar pinned at the top (the list's own sticky header), on the
 * page's solid colour edge to edge, under a title that scrolls away if it
 * has one.
 */
function PinnedList<Item>({
  testID,
  data,
  renderItem,
  keyExtractor,
  empty,
  contentStyle,
  onScroll,
  pinned,
}: ListParts<Item> & { pinned: NonNullable<ListScreenProps<Item>["pinned"]> }) {
  const theme = useTheme();
  const clearance = useFrameClearance();
  const insetTop = useContext(SafeAreaInsetsContext)?.top ?? 0;
  const rows: readonly (Item | typeof BAR)[] = [BAR, ...data];
  // The bar's height: where its foot is, for the rounded edge laid over the list there.
  const [barHeight, setBarHeight] = useState(0);
  // Only a bar pinned from the start (no title above it) keeps its foot in one place.
  const rounded = pinned.title ? undefined : pinned.rounded;
  // Pulled down past the top, the bar comes down with the list; the edge follows it, never over it.
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
    if (onScroll) runOnJS(onScroll)(event.contentOffset.y);
  });
  const edgeStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.max(-scrollY.get(), 0) }],
  }));

  return (
    <View style={[styles.list, { marginTop: insetTop }]}>
      <Animated.FlatList
        testID={testID}
        onScroll={scrollHandler}
        scrollEventThrottle={SCROLL_THROTTLE_MS}
        style={styles.list}
        data={rows}
        keyExtractor={(row) => (row === BAR ? "pinned-bar" : keyExtractor(row))}
        renderItem={(info) =>
          info.item === BAR ? (
            <View
              testID={`${testID}-pinned-bar`}
              style={[styles.bar, { backgroundColor: theme.colors.background }]}
              {...(rounded !== undefined && {
                onLayout: (event: LayoutChangeEvent) =>
                  setBarHeight(event.nativeEvent.layout.height),
              })}
            >
              {pinned.bar}
            </View>
          ) : (
            renderItem({ ...info, item: info.item, index: info.index - 1 })
          )
        }
        // With a title, it's the scroll's first child (the list's header) and the bar the second.
        stickyHeaderIndices={[pinned.title ? 1 : 0]}
        contentContainerStyle={[SCROLL_INSET, contentStyle]}
        showsVerticalScrollIndicator={false}
        {...(pinned.title && {
          ListHeaderComponent: (
            <View testID={`${testID}-title`} style={styles.title}>
              {pinned.title}
            </View>
          ),
        })}
        ListFooterComponent={
          <>
            {data.length === 0 && empty}
            <View testID={`${testID}-bottom-clearance`} style={{ height: clearance.bottom }} />
          </>
        }
      />
      {rounded !== undefined && barHeight > 0 && (
        <Animated.View pointerEvents="none" style={[styles.edge, { top: barHeight }, edgeStyle]}>
          <RoundedEdge testID={`${testID}-rounded-edge`} radius={rounded} inset={PAGE_INSET} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  title: { paddingTop: PAGE_TOP },
  // The rounded edge's place: at the bar's foot, across the full width.
  edge: { position: "absolute", left: 0, right: 0 },
  // Out to the screen's edges, so nothing scrolling under it shows at its sides.
  bar: {
    marginHorizontal: -PAGE_INSET,
    paddingHorizontal: PAGE_INSET,
    paddingVertical: space[12],
  },
});
