import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Search } from "lucide-react-native";

import { controlHeight, motion, space } from "@/theme";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { FilterPills } from "@/ui/molecules/FilterPills";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import type { PlanFilter } from "../logic/plan-filters";

/** Room either side of the pills, so the outline's spring never meets the row's clipped edge. */
const PILLS_ROOM = space[12];
/** The row's height: the search button's. */
const ROW_HEIGHT = controlHeight.headerButton;
/** Every selection outline's spring — the title and filters move alike. */
const SLIDE = { ...motion.slide, reduceMotion: ReduceMotion.System } as const;

export type PlansHeaderProps = {
  /** Scrolled down: the title is gone and the filters have taken its place. */
  collapsed: boolean;
  filters: readonly { label: PlanFilter; count: number }[];
  filter: PlanFilter | null;
  onPickFilter: (label: PlanFilter) => void;
  onSearch: () => void;
};

/**
 * Plans' header: the title; the filters centred in the room beside it; the
 * search at the right. Once the list scrolls, the title is bumped left off
 * the screen and the filters spring left into its place; back at the top,
 * both return.
 */
export function PlansHeader({
  collapsed,
  filters,
  filter,
  onPickFilter,
  onSearch,
}: PlansHeaderProps) {
  const [room, setRoom] = useState(0);
  const [titleWidth, setTitleWidth] = useState(0);
  const [pillsWidth, setPillsWidth] = useState(0);
  const measured = room > 0 && titleWidth > 0 && pillsWidth > 0;
  // Centred in what the title leaves; at the row's start once the title's gone.
  const filtersX = collapsed ? 0 : titleWidth + Math.max((room - titleWidth - pillsWidth) / 2, 0);
  const titleX = collapsed ? -(titleWidth + PAGE_INSET) : 0;

  const filtersOffset = useSharedValue(0);
  const titleOffset = useSharedValue(0);
  // The first place is taken at once; only changes after it spring.
  const placed = useRef(false);
  useEffect(() => {
    if (!measured) return;
    if (placed.current) {
      filtersOffset.set(withSpring(filtersX, SLIDE));
      titleOffset.set(withSpring(titleX, SLIDE));
    } else {
      placed.current = true;
      filtersOffset.set(filtersX);
      titleOffset.set(titleX);
    }
  }, [measured, filtersX, titleX, filtersOffset, titleOffset]);

  const filtersStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: filtersOffset.get() }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: titleOffset.get() }],
  }));
  const width = (set: (value: number) => void) => (event: LayoutChangeEvent) =>
    set(event.nativeEvent.layout.width);

  return (
    <View testID="plans-header" style={[styles.row, { gap: space[8] }]}>
      <View style={styles.room} onLayout={width(setRoom)}>
        <Animated.View style={titleStyle} onLayout={width(setTitleWidth)}>
          <SFProTitle accessibilityRole="header">Plans</SFProTitle>
        </Animated.View>
        <Animated.View
          style={[styles.filters, { opacity: measured ? 1 : 0 }, filtersStyle]}
          onLayout={width(setPillsWidth)}
        >
          <FilterPills
            testID="plans-filter-pills"
            tight
            bleed={PILLS_ROOM}
            options={filters}
            selected={filter}
            onSelect={onPickFilter}
          />
        </Animated.View>
      </View>
      <HeaderIconButton
        testID="plans-search-button"
        icon={Search}
        accessibilityLabel="Search your plans"
        onPress={onSearch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: ROW_HEIGHT, flexDirection: "row", alignItems: "center" },
  room: { flex: 1, height: ROW_HEIGHT, flexDirection: "row", alignItems: "center" },
  // Placed along the row by its offset, from the row's start.
  filters: { position: "absolute", left: 0, top: 0, bottom: 0, justifyContent: "center" },
});
