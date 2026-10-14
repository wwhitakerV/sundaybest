import { memo, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { useTheme } from "@/theme";
import { useIntroClock } from "../../hooks/use-intro-clock";
import { beatList } from "../../logic/frame-stats";
import { uncoveredTo } from "../../logic/water/drain";
import { buildWaterScene } from "../../logic/water/scene";
import { WATER_SETTINGS } from "../../logic/water/settings";
import { IntroReadyBridge } from "../IntroReadyBridge";
import { WaterCanvas } from "./WaterCanvas";

export type WaterIntroPlayerProps = {
  revealed: SharedValue<number>;
  /** How far down the drain has uncovered the page, for its pieces to arrive by (`Arrive`). */
  uncovered: SharedValue<number>;
  /** The water starts to drain: the page is shown under it. */
  onReveal: () => void;
  onDone: () => void;
};

/**
 * The water intro. Until the screen is full of water it covers the app in the
 * launch's page colour; then that goes — on the UI thread, in the same frame the
 * water is full — and once the page is ready the water drains away from the top
 * down, revealing the page underneath as it falls, its pieces arriving as the
 * water's edge passes them. Nothing outside it re-renders it while it plays.
 */
export const WaterIntroPlayer = memo(function WaterIntroPlayer({
  revealed,
  uncovered,
  onReveal,
  onDone,
}: WaterIntroPlayerProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const scene = useMemo(() => buildWaterScene(WATER_SETTINGS, { width, height }), [width, height]);
  const timing = useMemo(
    () => ({
      holdEnd: scene.beats.hold.end,
      firstHit: Math.min(...scene.world.falls.map((fall) => fall.hit)),
      splashStart: scene.beats.splash.start,
      revealAt: scene.revealAt,
      doneAt: scene.total,
      beats: beatList(scene.beats),
    }),
    [scene],
  );
  const { time, ready } = useIntroClock(timing, { revealed, onReveal, onDone });
  const full = scene.beats.hold.start;
  const white = useAnimatedStyle(() => ({ opacity: time.get() < full ? 1 : 0 }));

  // The drain's edge, for the page's pieces: only once it has started to drain.
  useAnimatedReaction(
    () => (time.get() >= scene.revealAt ? uncoveredTo(scene, time.get()) : null),
    (line) => {
      if (line !== null) uncovered.set(line);
    },
    [scene],
  );

  return (
    <View testID="launch-intro-water" style={StyleSheet.absoluteFill}>
      <Animated.View
        testID="launch-intro-white"
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.launchPage }, white]}
      />
      <WaterCanvas testID="launch-intro-canvas" scene={scene} time={time} onFail={onDone} />
      <IntroReadyBridge ready={ready} time={time} />
    </View>
  );
});
