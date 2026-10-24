import { StyleSheet, View } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";

import { motion, space, useTheme } from "@/theme";
import { getDotScale } from "@/utils/paging/getDotScale";
import { getDotWindowStart } from "@/utils/paging/getDotWindowStart";

/** At most this many dots at full size; past them, the ends grow smaller. */
const FULL = 4;
/** Places kept either side of the full dots for the smaller ones. */
const EDGE = 2;
const DOT = space[6];
const PITCH = DOT + space[6];
const SLIDE = { ...motion.slide, reduceMotion: ReduceMotion.System } as const;

export type PageDotsProps = {
  count: number;
  /** Where the pages are, in pages: 1.5 is halfway from the second to the third. */
  position: SharedValue<number>;
  /** What it says to VoiceOver ("Plan 2 of 7"). */
  accessibilityLabel: string;
  testID?: string;
};

/**
 * Which page is in view, as Instagram's carousel dots show it: a dot a page,
 * the one in view in the accent. Up to four, all full size; past four, a
 * window of four full dots, the next out either side smaller and the one
 * beyond smaller still, the window sliding a dot along as the page in view
 * reaches its end. It changes as a page passes halfway, not once it settles.
 */
export function PageDots({ count, position, accessibilityLabel, testID }: PageDotsProps) {
  const windowed = count > FULL;
  const target = useSharedValue(0);
  const start = useSharedValue(0);

  useAnimatedReaction(
    () => Math.round(position.get()),
    (active, before) => {
      if (active === before) return;
      const next = getDotWindowStart(target.get(), active, count, FULL);
      if (next === target.get()) return;
      target.set(next);
      start.set(before === null ? next : withSpring(next, SLIDE));
    },
    [count],
  );

  const row = useAnimatedStyle(() => ({
    transform: [{ translateX: windowed ? (EDGE - start.get()) * PITCH : 0 }],
  }));
  const width = (windowed ? FULL + EDGE * 2 : count) * PITCH - (PITCH - DOT);

  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={accessibilityLabel}
      style={[styles.frame, { width }]}
    >
      <Animated.View style={[styles.row, row]}>
        {Array.from({ length: count }, (_, index) => (
          <Dot key={index} index={index} position={position} start={windowed ? start : null} />
        ))}
      </Animated.View>
    </View>
  );
}

function Dot({
  index,
  position,
  start,
}: {
  index: number;
  position: SharedValue<number>;
  /** Where the window of full dots starts; none when every dot is full. */
  start: SharedValue<number> | null;
}) {
  const theme = useTheme();
  const { accent, progressTrack } = theme.colors;
  const style = useAnimatedStyle(() => ({
    backgroundColor: Math.round(position.get()) === index ? accent : progressTrack,
    transform: [{ scale: start ? getDotScale(index, start.get(), FULL) : 1 }],
  }));
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  frame: { height: DOT, overflow: "hidden" },
  row: { flexDirection: "row", gap: PITCH - DOT },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
});
