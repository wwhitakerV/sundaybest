import { memo, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";

import { useTheme } from "@/theme";
import { useIntroClock } from "../hooks/use-intro-clock";
import { beatList } from "../logic/frame-stats";
import { buildScene } from "../logic/scene";
import { INTRO_SETTINGS } from "../logic/settings";
import { IntroCanvas } from "./IntroCanvas";
import { IntroReadyBridge } from "./IntroReadyBridge";

/**
 * The full intro. Until the screen is full colour it covers the app in the
 * launch's page colour; then that goes — on the UI thread, in the same frame
 * the drawing is full — and the page underneath is revealed as the colour
 * starts to fall. It takes touches until it's over. Nothing outside it
 * re-renders it while it plays, and it doesn't re-render itself.
 */
export const IntroPlayer = memo(function IntroPlayer({
  revealed,
  onDone,
}: {
  revealed: SharedValue<number>;
  onDone: () => void;
}) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const scene = useMemo(() => buildScene(INTRO_SETTINGS, { width, height }), [width, height]);
  // It ends as the full-colour hold does: the page arrives under it there.
  const timing = useMemo(
    () => ({
      holdEnd: scene.beats.hold.end,
      firstHit: Math.min(...scene.world.falls.map((fall) => fall.hit)),
      splashStart: scene.beats.splash.start,
      revealAt: scene.beats.hold.end,
      doneAt: scene.beats.hold.end,
      beats: beatList(scene.beats),
    }),
    [scene],
  );
  const { time, ready } = useIntroClock(timing, { revealed, onDone });
  const fullRed = scene.beats.hold.start;
  const white = useAnimatedStyle(() => ({ opacity: time.get() < fullRed ? 1 : 0 }));

  return (
    <View testID="launch-intro-player" style={StyleSheet.absoluteFill}>
      <Animated.View
        testID="launch-intro-white"
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.launchPage }, white]}
      />
      <IntroCanvas testID="launch-intro-canvas" scene={scene} time={time} />
      <IntroReadyBridge ready={ready} time={time} />
    </View>
  );
});
