import { useCallback, useState, type ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";

import { LAUNCH_INTRO } from "@/theme/launch-colors";
import { ArrivalContext, ArrivalLineContext, COVERED, UNCOVERED } from "@/ui/arrival/arrival";
import { IntroFailSafe } from "./IntroFailSafe";
import { LaunchIntro } from "./LaunchIntro";

/**
 * The app, with the launch intro over it. The page underneath (Welcome or
 * Home) mounts and loads as usual but stays invisible while the intro plays,
 * so it can never show early, whatever happens above it. When the intro reveals
 * it, the page shows — its own background where the full colour was — and its
 * pieces arrive (`Arrive`): in a cascade as the pool intro and its movie go, or
 * as the water intro's edge passes each of them while it drains (`uncovered`).
 * However the intro ends, the page is shown.
 */
export function LaunchStage({ children }: { children: ReactNode }) {
  const revealed = useSharedValue(0);
  const [shown, setShown] = useState(false);
  const reveal = useCallback(() => {
    revealed.set(1);
    setShown(true);
  }, [revealed]);
  const hidden = useAnimatedStyle(() => ({ opacity: revealed.get() }));
  // How far down the water has uncovered the page; the pool intro and its movie lift all at once.
  const uncovered = useSharedValue(COVERED);
  const cascade = LAUNCH_INTRO === "pool" || LAUNCH_INTRO === "pool-movie";
  const line = cascade ? null : uncovered;
  const fail = useCallback(() => {
    uncovered.set(UNCOVERED);
    reveal();
  }, [uncovered, reveal]);

  return (
    <>
      <Animated.View testID="launch-stage-page" style={[styles.page, !shown && hidden]}>
        {/* Its pieces wait, hidden, until the intro has gone; then they arrive (`Arrive`). */}
        <ArrivalContext.Provider value={shown ? "arriving" : "waiting"}>
          <ArrivalLineContext.Provider value={line}>{children}</ArrivalLineContext.Provider>
        </ArrivalContext.Provider>
      </Animated.View>
      <IntroFailSafe onFail={fail}>
        <LaunchIntro revealed={revealed} onReveal={reveal} uncovered={uncovered} />
      </IntroFailSafe>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
});
