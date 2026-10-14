import { useCallback, useEffect, useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { FullWindowOverlay } from "react-native-screens";

import { useReduceMotionSetting } from "@/core/accessibility/use-reduce-motion";
import { useTheme } from "@/theme";
import { LAUNCH_INTRO } from "@/theme/launch-colors";
import { UNCOVERED } from "@/ui/arrival/arrival";
import { IntroPlayer } from "./IntroPlayer";
import { MovieIntroPlayer } from "./movie/MovieIntroPlayer";
import { PoolMovieIntroPlayer } from "./movie/PoolMovieIntroPlayer";
import { ReducedMotionLaunch } from "./ReducedMotionLaunch";
import type { Reveal } from "./reveal";
import { WaterIntroPlayer } from "./water/WaterIntroPlayer";

export type LaunchIntroProps = Reveal & {
  /** How far down the page is uncovered, for its pieces to arrive by (the water intro's drain). */
  uncovered: SharedValue<number>;
};

/**
 * The cold-launch intro, over the whole app. It opens on the same colour as the
 * native launch screen, so the hand-off is invisible; plays the intro
 * `launch-colors.json` names — the pool's movie, the water's movie, the water
 * drawn live, or the pool — (or, with Reduce Motion
 * on, only fades away); and reveals the page underneath once it's ready. It plays
 * once per launch: when it's done it's gone for as long as the app runs. The
 * status bar stays hidden while it covers the page; while the water drains or
 * fades off the page, the status bar is back and touches reach the page.
 */
export function LaunchIntro({ revealed, onReveal, uncovered }: LaunchIntroProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotionSetting();
  const [done, setDone] = useState(false);
  const [draining, setDraining] = useState(false);
  const show = useCallback(() => {
    revealed.set(1);
    onReveal();
  }, [revealed, onReveal]);
  const uncoverAll = useCallback(() => uncovered.set(UNCOVERED), [uncovered]);
  // However it ends, the page is shown, all of it: when it's done, and if it's ever taken away.
  const finish = useCallback(() => {
    show();
    uncoverAll();
    setDone(true);
  }, [show, uncoverAll]);
  const drain = useCallback(() => {
    show();
    setDraining(true);
  }, [show]);
  useEffect(
    () => () => {
      show();
      uncoverAll();
    },
    [show, uncoverAll],
  );

  if (done) return null;

  // Its own window, above the app's: nothing the navigator attaches underneath — a
  // screen mounting, a transition — can draw above it, even for a frame.
  return (
    <FullWindowOverlay>
      <View
        testID="launch-intro"
        pointerEvents={draining ? "none" : "box-none"}
        style={StyleSheet.absoluteFill}
      >
        <StatusBar hidden={!draining} />
        {reduceMotion === null ? (
          // Until iOS says whether Reduce Motion is on, nothing starts: only the page colour.
          <View
            testID="launch-intro-cover"
            style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.launchPage }]}
          />
        ) : reduceMotion ? (
          <ReducedMotionLaunch revealed={revealed} onStart={uncoverAll} onDone={finish} />
        ) : LAUNCH_INTRO === "pool-movie" ? (
          <PoolMovieIntroPlayer revealed={revealed} onReveal={drain} onDone={finish} />
        ) : LAUNCH_INTRO === "movie" ? (
          <MovieIntroPlayer
            revealed={revealed}
            uncovered={uncovered}
            onReveal={drain}
            onDone={finish}
          />
        ) : LAUNCH_INTRO === "water" ? (
          <WaterIntroPlayer
            revealed={revealed}
            uncovered={uncovered}
            onReveal={drain}
            onDone={finish}
          />
        ) : (
          <IntroPlayer revealed={revealed} onDone={finish} />
        )}
      </View>
    </FullWindowOverlay>
  );
}
