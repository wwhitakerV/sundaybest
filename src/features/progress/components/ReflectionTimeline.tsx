import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { controlHeight, motion, radius, space, useTheme } from "@/theme";
import { MonoLabel } from "@/ui/typography/MonoLabel";

/** A mark, and the one in view — taller, in the accent. */
const MARK_WIDTH = 2;
const MARK_HEIGHT = 12;
const SHOWN_HEIGHT = 24;
/** Every selection outline's spring — the mark in view slides alike. */
const SLIDE = { ...motion.slide, reduceMotion: ReduceMotion.System } as const;

export type ReflectionTimelineProps = {
  /** How many marks, oldest to newest, spaced evenly by count. */
  count: number;
  /** The mark in view. */
  shown: number;
  /** Its ends' names: the first's month; "This week", or the newest's month. */
  ends: { start: string; end: string };
  /** A mark scrubbed across or tapped. */
  onShow: (index: number) => void;
  /** A finger on it, or none: the page holds its back swipe meanwhile. */
  onTouching: (touching: boolean) => void;
  testID: string;
};

/**
 * Every reflection as a mark, oldest on the left, evenly spaced; the one in
 * view in the accent, sliding to each new one. Too close to tap one by one,
 * it's scrubbed: a finger down picks the nearest mark, and a drag picks each
 * it passes, the reflection keeping up with no delay.
 */
export function ReflectionTimeline({
  count,
  shown,
  ends,
  onShow,
  onTouching,
  testID,
}: ReflectionTimelineProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  // Marks' centres run from edge to edge; a lone mark sits at the start.
  const step = count > 1 ? (width - MARK_WIDTH) / (count - 1) : 0;
  const centre = (index: number) => MARK_WIDTH / 2 + index * step;

  const shownX = useSharedValue(0);
  // Placed at once the first time it's measured; after that, it slides to each mark shown.
  const placed = useRef(false);
  useEffect(() => {
    if (width === 0) return;
    const target = MARK_WIDTH / 2 + shown * (count > 1 ? (width - MARK_WIDTH) / (count - 1) : 0);
    shownX.set(placed.current ? withSpring(target, SLIDE) : target);
    placed.current = true;
  }, [shown, width, count, shownX]);

  const markAt = (x: number) => {
    "worklet";
    if (step === 0) return 0;
    return Math.min(Math.max(Math.round((x - MARK_WIDTH / 2) / step), 0), count - 1);
  };
  const scrub = Gesture.Pan()
    .minDistance(0)
    .onBegin((event) => {
      runOnJS(onTouching)(true);
      runOnJS(onShow)(markAt(event.x));
    })
    .onUpdate((event) => {
      runOnJS(onShow)(markAt(event.x));
    })
    .onFinalize(() => {
      runOnJS(onTouching)(false);
    });

  const shownStyle = useAnimatedStyle(() => ({ left: shownX.get() - MARK_WIDTH / 2 }));

  return (
    <GestureHandlerRootView testID={testID} style={styles.root}>
      <GestureDetector gesture={scrub}>
        <View
          accessibilityRole="adjustable"
          accessibilityLabel="Your reflections, oldest to newest"
          accessibilityValue={{ min: 1, max: count, now: shown + 1 }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={({ nativeEvent }) => {
            const next = shown + (nativeEvent.actionName === "increment" ? 1 : -1);
            if (next >= 0 && next < count) onShow(next);
          }}
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          style={styles.track}
        >
          {width > 0 &&
            Array.from({ length: count }, (_, index) => (
              <View
                // A mark's place on the line is its identity.
                key={`mark-${index}`}
                style={[
                  styles.mark,
                  {
                    left: centre(index) - MARK_WIDTH / 2,
                    backgroundColor: theme.colors.textMuted,
                    borderRadius: radius.pill,
                  },
                ]}
              />
            ))}
          {width > 0 && (
            <Animated.View
              testID={`${testID}-shown`}
              style={[
                styles.shown,
                { backgroundColor: theme.colors.accent, borderRadius: radius.pill },
                shownStyle,
              ]}
            />
          )}
        </View>
      </GestureDetector>
      <View style={[styles.ends, { marginTop: space[8] }]}>
        <MonoLabel variant="label" tone="text">
          {ends.start}
        </MonoLabel>
        <MonoLabel variant="label" tone="text">
          {ends.end}
        </MonoLabel>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 0 },
  // Tall enough to land a finger on; the marks stand on its floor.
  track: { height: controlHeight.hitTarget },
  mark: { position: "absolute", bottom: 0, width: MARK_WIDTH, height: MARK_HEIGHT },
  shown: { position: "absolute", bottom: 0, width: MARK_WIDTH, height: SHOWN_HEIGHT },
  ends: { flexDirection: "row", justifyContent: "space-between" },
});
