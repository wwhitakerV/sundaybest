import { useCallback, useEffect, useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { FullWindowOverlay } from "react-native-screens";

import { useReduceMotionSetting } from "@/core/accessibility/use-reduce-motion";
import { useTheme } from "@/theme";
import { IntroPlayer } from "./IntroPlayer";
import { ReducedMotionLaunch } from "./ReducedMotionLaunch";
import type { Reveal } from "./reveal";

/**
 * The cold-launch intro, over the whole app. It opens on the same plain white
 * as the native launch screen, so the hand-off is invisible; plays the pen and
 * the pool (or, with Reduce Motion on, only fades away); and reveals the page
 * underneath once it's ready. It plays once per launch: when it's done it's
 * gone for as long as the app runs. The status bar stays hidden while it plays.
 */
export function LaunchIntro({ revealed, onReveal }: Reveal) {
  const theme = useTheme();
  const reduceMotion = useReduceMotionSetting();
  const [done, setDone] = useState(false);
  // However it ends, the page is shown: when it's done, and if it's ever taken away.
  const finish = useCallback(() => {
    revealed.set(1);
    onReveal();
    setDone(true);
  }, [revealed, onReveal]);
  useEffect(
    () => () => {
      revealed.set(1);
      onReveal();
    },
    [revealed, onReveal],
  );

  if (done) return null;

  // Its own window, above the app's: nothing the navigator attaches underneath — a
  // screen mounting, a transition — can draw above it, even for a frame.
  return (
    <FullWindowOverlay>
      <View testID="launch-intro" pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <StatusBar hidden />
        {reduceMotion === null ? (
          // Until iOS says whether Reduce Motion is on, nothing starts: only the white.
          <View
            testID="launch-intro-cover"
            style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.launchPage }]}
          />
        ) : reduceMotion ? (
          <ReducedMotionLaunch revealed={revealed} onDone={finish} />
        ) : (
          <IntroPlayer revealed={revealed} onDone={finish} />
        )}
      </View>
    </FullWindowOverlay>
  );
}
