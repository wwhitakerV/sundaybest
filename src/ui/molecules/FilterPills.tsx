import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { motion, radius, space, useTheme } from "@/theme";
import type { FilterOption } from "./FilterTabs";
import { SFProLabel } from "@/ui/typography/SFProLabel";

/** A pill's height, and so the row's: what a header fading across it reaches over. */
export const FILTER_PILLS_HEIGHT = 36;
const HEIGHT = FILTER_PILLS_HEIGHT;
/** The outline round the pill picked — as heavy as Plan Detail's day outline. */
const OUTLINE = 2;
/** Plan Detail's day outline's spring — every selection outline moves alike. */
const SLIDE = { ...motion.slide, reduceMotion: ReduceMotion.System } as const;

type Frame = { x: number; width: number };

/** How often the row reports where it's scrolled: once a frame. */
const SCROLL_THROTTLE_MS = 16;

export type FilterPillsProps<Option extends FilterOption> = {
  options: readonly Option[];
  /** The one picked — or null, none, where a row lets its pick go (Plans). */
  selected: Option["label"] | null;
  onSelect: (label: Option["label"]) => void;
  /**
   * How far the row reaches past its container on each side — the page's
   * inset — so it scrolls to the screen's edges while its first pill still
   * lines up with the page.
   */
  bleed?: number;
  /** Closer set: a little less room inside each pill and between them, for a row in a tight space. */
  tight?: boolean;
  testID?: string;
};

/**
 * A row of filters as pills, each its label and its count (if it has one) set small above, with no fill — as
 * Plan Detail's days have none. The one picked is outlined in black: one
 * outline, drawn once its pill is measured, that slides to each pill picked
 * and lands without a bounce. It scrolls sideways when the pills outgrow the
 * row, and brings the pill picked into view when it's picked from elsewhere.
 * For the borderless look, see `FilterTabs`.
 */
export function FilterPills<Option extends FilterOption>({
  options,
  selected,
  onSelect,
  bleed = 0,
  tight = false,
  testID,
}: FilterPillsProps<Option>) {
  const [frames, setFrames] = useState<ReadonlyMap<string, Frame>>(new Map());
  const picked = selected === null ? undefined : frames.get(selected);

  function measure(label: string, { nativeEvent: { layout } }: LayoutChangeEvent) {
    setFrames((current) => new Map(current).set(label, { x: layout.x, width: layout.width }));
  }

  // The pill picked is kept in view — picked from elsewhere (The Word's map), the row brings it in.
  const scroll = useRef<ScrollView>(null);
  const view = useRef({ offset: 0, width: 0 });
  useEffect(() => {
    if (!picked || view.current.width === 0) return;
    const { offset, width } = view.current;
    const start = picked.x - bleed;
    const end = picked.x + picked.width + bleed;
    if (start < offset) scroll.current?.scrollTo({ x: Math.max(start, 0), animated: true });
    else if (end > offset + width) scroll.current?.scrollTo({ x: end - width, animated: true });
  }, [picked, bleed]);

  return (
    <ScrollView
      ref={scroll}
      testID={testID}
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={SCROLL_THROTTLE_MS}
      onScroll={(event) => {
        view.current.offset = event.nativeEvent.contentOffset.x;
      }}
      onLayout={(event) => {
        view.current.width = event.nativeEvent.layout.width;
      }}
      style={[styles.row, { marginHorizontal: -bleed }]}
      contentContainerStyle={{ gap: tight ? space[4] : space[8], paddingHorizontal: bleed }}
    >
      {picked && <Outline frame={picked} {...(testID && { testID: `${testID}-indicator` })} />}
      {options.map((option) => {
        const isSelected = option.label === selected;

        return (
          <Pressable
            key={option.label}
            testID={testID && `${testID}-option-${option.label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            // Up to a 44pt target, meeting the next pill halfway across the gap.
            hitSlop={space[4]}
            onLayout={(event) => measure(option.label, event)}
            onPress={() => onSelect(option.label)}
            style={[
              styles.pill,
              {
                borderRadius: radius.pill,
                paddingHorizontal: tight ? space[12] : space[16],
              },
            ]}
          >
            {/* The count rides small at the label's top, as `FilterTabs`' do: a superscript. */}
            <View style={[styles.label, { gap: space[2] }]}>
              <SFProLabel variant="segment" tone="text">
                {option.label}
              </SFProLabel>
              {option.count !== undefined && (
                <SFProLabel variant="filterCount" tone="textInactive">
                  {option.count}
                </SFProLabel>
              )}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** The outline round the pill picked: in place from the start, then sliding to each new one. */
function Outline({ frame, testID }: { frame: Frame; testID?: string }) {
  const theme = useTheme();
  const x = useSharedValue(frame.x);
  const width = useSharedValue(frame.width);
  useEffect(() => {
    x.set(withSpring(frame.x, SLIDE));
    width.set(withSpring(frame.width, SLIDE));
  }, [frame.x, frame.width, x, width]);
  const style = useAnimatedStyle(() => ({
    width: width.get(),
    transform: [{ translateX: x.get() }],
  }));

  return (
    <Animated.View
      testID={testID}
      pointerEvents="none"
      style={[styles.outline, { borderColor: theme.colors.text, borderRadius: radius.pill }, style]}
    />
  );
}

const styles = StyleSheet.create({
  // A horizontal ScrollView grows, and shrinks, with the column it's in by
  // default; this row keeps to its pills' height — never squeezed by a list
  // below it, which cut the pills off at their foot.
  row: { flexGrow: 0, flexShrink: 0 },
  pill: { height: HEIGHT, flexDirection: "row", alignItems: "center" },
  label: { flexDirection: "row", alignItems: "flex-start" },
  // Placed along the row by its slide (`translateX`), from the row's own edge.
  outline: { position: "absolute", top: 0, left: 0, height: HEIGHT, borderWidth: OUTLINE },
});
