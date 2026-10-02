import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, type LayoutChangeEvent } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { motion, radius, space, useTheme } from "@/theme";
import type { FilterOption } from "./FilterTabs";
import { SFProLabel } from "@/ui/typography/SFProLabel";

const HEIGHT = 36;
/** The outline round the pill picked — as heavy as Plan Detail's day outline. */
const OUTLINE = 2;
/** Plan Detail's day outline's spring — every selection outline moves alike. */
const SLIDE = { ...motion.slide, reduceMotion: ReduceMotion.System } as const;

type Frame = { x: number; width: number };

export type FilterPillsProps<Option extends FilterOption> = {
  options: readonly Option[];
  selected: Option["label"];
  onSelect: (label: Option["label"]) => void;
  /**
   * How far the row reaches past its container on each side — the page's
   * inset — so it scrolls to the screen's edges while its first pill still
   * lines up with the page.
   */
  bleed?: number;
  testID?: string;
};

/**
 * A row of filters as pills, each its label and count, with no fill — as
 * Plan Detail's days have none. The one picked is outlined in black: one
 * outline, drawn once its pill is measured, that slides to each pill picked
 * and lands without a bounce. It scrolls sideways when the pills outgrow the
 * row. For the borderless look, see `FilterTabs`.
 */
export function FilterPills<Option extends FilterOption>({
  options,
  selected,
  onSelect,
  bleed = 0,
  testID,
}: FilterPillsProps<Option>) {
  const [frames, setFrames] = useState<ReadonlyMap<string, Frame>>(new Map());
  const picked = frames.get(selected);

  function measure(label: string, { nativeEvent: { layout } }: LayoutChangeEvent) {
    setFrames((current) => new Map(current).set(label, { x: layout.x, width: layout.width }));
  }

  return (
    <ScrollView
      testID={testID}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.row, { marginHorizontal: -bleed }]}
      contentContainerStyle={{ gap: space[8], paddingHorizontal: bleed }}
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
              { borderRadius: radius.pill, paddingHorizontal: space[16], gap: space[4] },
            ]}
          >
            <SFProLabel variant="segment" tone="text">
              {option.label}
            </SFProLabel>
            <SFProLabel variant="segment" tone="textInactive">
              {option.count}
            </SFProLabel>
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
  // Placed along the row by its slide (`translateX`), from the row's own edge.
  outline: { position: "absolute", top: 0, left: 0, height: HEIGHT, borderWidth: OUTLINE },
});
