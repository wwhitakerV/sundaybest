import { useEffect, useMemo } from "react";
import { PanResponder, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";
import { motion, radius, space, useTheme } from "@/theme";
import { DayTile, type DayTileLook } from "@/ui/molecules/DayTile";
import { PAGE_INSET } from "@/ui/organisms/Screen";

const DAYS = 7;
/** The week's tiles: a little shorter than Plan Detail's, so the week sits lighter. */
export const WEEK_TILE_HEIGHT = 72;
/** Up a little toward the title, so the week reads as part of the head. */
const LIFT = space[6];
/** Between one day and the next. */
const DAY_GAP = space[6];
/** The outline round the day picked: Plan Detail's, as heavy and as round. */
const OUTLINE = 2;
/** How far a swipe goes before it changes the week. */
const SWIPE = 56;
/** A sideways move this long, and longer than it is tall, is a swipe, not a tap. */
const SWIPE_START = 10;
/** How long the week takes to slide out, and the next in. */
const SLIDE_MS = 220;

export type WeekStripProps = {
  tiles: readonly { date: string; look: DayTileLook }[];
  selected: string;
  onSelect: (date: string) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

/**
 * The week's seven days as Plan Detail's day tiles, fitted across the page,
 * the day picked outlined as Plan Detail outlines it — one outline that
 * springs to each day picked. Swiped right it goes back a week, left it comes
 * forward, sliding with the finger; it stops at this week and at the first.
 */
export function WeekStrip({
  tiles,
  selected,
  onSelect,
  canGoBack,
  canGoForward,
  onPrevious,
  onNext,
}: WeekStripProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const { width } = useWindowDimensions();
  const rowWidth = width - PAGE_INSET * 2;
  const tileWidth = (rowWidth - DAY_GAP * (DAYS - 1)) / DAYS;
  const index = Math.max(
    0,
    tiles.findIndex((tile) => tile.date === selected),
  );

  const outlineX = useSharedValue(index * (tileWidth + DAY_GAP));
  useEffect(() => {
    outlineX.set(withSpring(index * (tileWidth + DAY_GAP), motion.slide));
  }, [index, tileWidth, outlineX]);
  const outlineStyle = useAnimatedStyle(() => ({ transform: [{ translateX: outlineX.get() }] }));

  const slide = useSharedValue(0);
  const slideStyle = useAnimatedStyle(() => ({ transform: [{ translateX: slide.get() }] }));
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, { dx, dy }) =>
          Math.abs(dx) > SWIPE_START && Math.abs(dx) > Math.abs(dy),
        onPanResponderMove: (_event, { dx }) => {
          // Past an end it barely moves: there's no week there.
          const blocked = (dx > 0 && !canGoBack) || (dx < 0 && !canGoForward);
          if (!reduceMotion) slide.set(blocked ? dx / 6 : dx);
        },
        onPanResponderRelease: (_event, { dx }) => {
          const back = dx > SWIPE && canGoBack;
          const forward = dx < -SWIPE && canGoForward;
          if (!back && !forward) {
            slide.set(withSpring(0, motion.slide));
            return;
          }
          const change = back ? onPrevious : onNext;
          if (reduceMotion) {
            change();
            return;
          }
          const out = back ? rowWidth : -rowWidth;
          slide.set(
            withTiming(out, { duration: SLIDE_MS }, (finished) => {
              if (!finished) return;
              runOnJS(change)();
              slide.set(-out);
              slide.set(withTiming(0, { duration: SLIDE_MS }));
            }),
          );
        },
        onPanResponderTerminate: () => slide.set(withSpring(0, motion.slide)),
      }),
    [canGoBack, canGoForward, onPrevious, onNext, reduceMotion, rowWidth, slide],
  );

  return (
    <View
      testID="progress-week-strip"
      accessibilityRole="tablist"
      style={{ marginTop: -LIFT }}
      {...pan.panHandlers}
    >
      <Animated.View style={[styles.row, { gap: DAY_GAP }, slideStyle]}>
        <Animated.View
          testID="progress-week-strip-outline"
          pointerEvents="none"
          style={[
            styles.outline,
            { width: tileWidth, borderColor: theme.colors.text, borderRadius: radius[16] },
            outlineStyle,
          ]}
        />
        {tiles.map((tile) => (
          <DayTile
            key={tile.date}
            testID={`progress-day-${tile.date}`}
            look={tile.look}
            selected={tile.date === selected}
            width={tileWidth}
            height={WEEK_TILE_HEIGHT}
            onPress={() => onSelect(tile.date)}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  // Over the days, placed along the row by its move (`translateX`).
  outline: {
    position: "absolute",
    top: 0,
    left: 0,
    height: WEEK_TILE_HEIGHT,
    borderWidth: OUTLINE,
    zIndex: 1,
  },
});
