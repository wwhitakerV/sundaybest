import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";

import { FORMATION_PAPER, useTheme } from "@/theme";
import { TRACK_COPY } from "../logic/formation-track-copy";

/** The rail's marks: how far apart, how long and how heavy; the one in hand, longer. */
const TICK = { every: 14, length: 8, weight: 1.5, inHand: 16 };
/** How strong the rail's marks are, against the paper. */
const RAIL_STRENGTH = 0.45;

export type TrackTickerProps = { shown: SharedValue<number>; testID?: string };

/**
 * A slim vertical rail, a mark to each station, top to bottom, and a
 * longer red mark on the one in hand — sliding with the track, one to one
 * with the finger, and catching in each notch with it: the page's scroll
 * position, read as iOS's is.
 */
export function TrackTicker({ shown, testID }: TrackTickerProps) {
  const { colors } = useTheme();
  const marker = useAnimatedStyle(() => ({
    transform: [{ translateY: shown.value * TICK.every }],
  }));
  return (
    <View
      testID={testID}
      pointerEvents="none"
      style={{ width: TICK.inHand, height: TICK.every * (TRACK_COPY.length - 1) + TICK.weight }}
    >
      {TRACK_COPY.map((copy, i) => (
        <View
          key={copy.label}
          style={[
            styles.tick,
            {
              top: i * TICK.every,
              backgroundColor: FORMATION_PAPER.graphite,
              opacity: RAIL_STRENGTH,
            },
          ]}
        />
      ))}
      <Animated.View style={[styles.marker, { backgroundColor: colors.accent }, marker]} />
    </View>
  );
}

const styles = StyleSheet.create({
  tick: { position: "absolute", left: 0, width: TICK.length, height: TICK.weight },
  marker: { position: "absolute", top: 0, left: 0, width: TICK.inHand, height: TICK.weight },
});
