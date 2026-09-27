import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { PAGE_INSET } from "@/ui/Screen";
import { useTheme } from "@/theme";
import { getRailScrollOffset, getRailTabX, type DayTileLook } from "../logic/day-rail";
import { DAY_TILE_HEIGHT, DAY_TILE_WIDTH, DayTile } from "./DayTile";

/** Between one day and the next — room enough that each reads as a point on a journey. */
const DAY_GAP = 6;
/** A day's pitch along the row: where each sits, and what the row snaps to. */
const PITCH = DAY_TILE_WIDTH + DAY_GAP;
const TAB_BORDER = 2;
/** The tab's move to a newly picked day: a quick spring, settling with the least give. */
const TAB_SPRING = { damping: 18, stiffness: 220, mass: 0.8 };

export type DayRailProps = {
  tiles: readonly DayTileLook[];
  /** The day picked, by number. */
  selected: number;
  onSelect: (dayNumber: number) => void;
  testID: string;
  /** Each tile's is this, then `-` and its day's number. */
  tileTestIDPrefix: string;
};

/**
 * A plan's days as one clean strip — its journey — running edge to edge and
 * scrolling sideways when there are more than fit, settling on a day. The
 * day picked (`DayTile`) is outlined in black — one outline, drawn once
 * over them, that springs across to each day picked. It opens with the day
 * picked brought into view.
 */
export function DayRail({ tiles, selected, onSelect, testID, tileTestIDPrefix }: DayRailProps) {
  const theme = useTheme();
  const { width: viewportWidth } = useWindowDimensions();
  const index = Math.max(
    0,
    tiles.findIndex((tile) => tile.number === selected),
  );
  // Where it opens — worked out once; after that it's the reader's to scroll.
  const [offset] = useState(() =>
    getRailScrollOffset({
      index,
      count: tiles.length,
      tileWidth: DAY_TILE_WIDTH,
      gap: DAY_GAP,
      inset: PAGE_INSET,
      viewportWidth,
    }),
  );

  const tabX = getRailTabX({ index, pitch: PITCH, inset: PAGE_INSET });
  const tabPosition = useSharedValue(tabX);
  useEffect(() => {
    tabPosition.set(withSpring(tabX, TAB_SPRING));
  }, [tabX, tabPosition]);
  const tabStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tabPosition.value }] }));

  return (
    <ScrollView
      testID={testID}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentOffset={{ x: offset, y: 0 }}
      snapToInterval={PITCH}
      decelerationRate="fast"
      accessibilityRole="tablist"
      style={styles.rail}
      contentContainerStyle={[styles.days, { gap: DAY_GAP }]}
    >
      <Animated.View
        testID={`${testID}-tab`}
        pointerEvents="none"
        style={[
          styles.tab,
          {
            borderColor: theme.colors.text,
            borderRadius: theme.radii.lg,
          },
          tabStyle,
        ]}
      />
      {tiles.map((tile) => (
        <DayTile
          key={tile.number}
          testID={`${tileTestIDPrefix}-${tile.number}`}
          look={tile}
          selected={tile.number === selected}
          onPress={() => onSelect(tile.number)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Out to the screen's edges, the days inset within.
  rail: { marginHorizontal: -PAGE_INSET, flexGrow: 0 },
  days: { paddingHorizontal: PAGE_INSET },
  // Behind the days, placed along the row by its move (`translateX`).
  tab: {
    position: "absolute",
    top: 0,
    left: 0,
    width: DAY_TILE_WIDTH,
    height: DAY_TILE_HEIGHT,
    borderWidth: TAB_BORDER,
    zIndex: 1,
    backgroundColor: "transparent",
  },
});
