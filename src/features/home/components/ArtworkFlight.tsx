import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";

import { VideoThumbnail } from "@/ui/VideoThumbnail";

export type ArtworkFlightProps = {
  thumbnailUrl: string | null;
  /** Where it is, how big, how round, and whether it's showing — from the scroll. */
  style?: StyleProp<AnimatedStyle<ViewStyle>>;
};

/**
 * The featured plan's artwork in flight: a copy that floats over everything
 * and travels from the hero's artwork up into the plan bar's thumbnail as
 * the plan collapses — while both of those hide. It sits exactly on one or
 * the other at each end, so the hand-off can't be seen. Never takes taps.
 */
export function ArtworkFlight({ thumbnailUrl, style }: ArtworkFlightProps) {
  return (
    <Animated.View
      testID="home-tab-artwork-flight"
      pointerEvents="none"
      style={[styles.flight, style]}
    >
      <VideoThumbnail uri={thumbnailUrl} style={styles.fill} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flight: { position: "absolute", overflow: "hidden" },
  // Filling the flight's box, which is 16:9 at every point of the way.
  fill: { width: "100%", height: "100%" },
});
