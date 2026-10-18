import { useCallback, useEffect, useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { FullWindowOverlay } from "react-native-screens";

import { useReduceMotionSetting } from "@/core/accessibility/use-reduce-motion";
import { useTheme } from "@/theme";
import { PaintMovieIntroPlayer } from "./movie/PaintMovieIntroPlayer";
import { ReducedMotionLaunch } from "./ReducedMotionLaunch";
import type { Reveal } from "./reveal";

export type LaunchIntroProps = Reveal;

/**
 * The cold-launch intro, over the whole app. It opens on the same red as the
 * native launch screen, so the hand-off is invisible; plays the paint movie (or,
 * with Reduce Motion on, only fades away); and reveals the page underneath once
 * it's ready. It plays once per launch: when it's done it's gone for as long as
 * the app runs. The status bar stays hidden while it covers the page; while it
 * fades off the page, the status bar is back and touches reach the page.
 */
export function LaunchIntro({ revealed, onReveal }: LaunchIntroProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotionSetting();
  const [done, setDone] = useState(false);
  const [fading, setFading] = useState(false);
  const show = useCallback(() => {
    revealed.set(1);
    onReveal();
  }, [revealed, onReveal]);
  // However it ends, the page is shown: when it's done, and if it's ever taken away.
  const finish = useCallback(() => {
    show();
    setDone(true);
  }, [show]);
  const handOver = useCallback(() => {
    show();
    setFading(true);
  }, [show]);
  useEffect(() => () => show(), [show]);

  if (done) return null;

  // Its own window, above the app's: nothing the navigator attaches underneath — a
  // screen mounting, a transition — can draw above it, even for a frame.
  return (
    <FullWindowOverlay>
      <View
        testID="launch-intro"
        pointerEvents={fading ? "none" : "box-none"}
        style={StyleSheet.absoluteFill}
      >
        <StatusBar hidden={!fading} />
        {reduceMotion === null ? (
          // Until iOS says whether Reduce Motion is on, nothing starts: only the page colour.
          <View
            testID="launch-intro-cover"
            style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.launchPage }]}
          />
        ) : reduceMotion ? (
          <ReducedMotionLaunch revealed={revealed} onDone={finish} />
        ) : (
          <PaintMovieIntroPlayer revealed={revealed} onReveal={handOver} onDone={finish} />
        )}
      </View>
    </FullWindowOverlay>
  );
}
