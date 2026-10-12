import { useCallback, useState, type ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";

import { ArrivalContext } from "@/ui/arrival/arrival";
import { IntroFailSafe } from "./IntroFailSafe";
import { LaunchIntro } from "./LaunchIntro";

/**
 * The app, with the launch intro over it. The page underneath (Welcome or
 * Home) mounts and loads as usual but stays invisible while the intro plays,
 * so it can never show early, whatever happens above it. When the intro ends,
 * the page shows — its own background where the full colour was — and its
 * pieces arrive (`Arrive`). However the intro ends, the page is shown.
 */
export function LaunchStage({ children }: { children: ReactNode }) {
  const revealed = useSharedValue(0);
  const [shown, setShown] = useState(false);
  const reveal = useCallback(() => {
    revealed.set(1);
    setShown(true);
  }, [revealed]);
  const hidden = useAnimatedStyle(() => ({ opacity: revealed.get() }));

  return (
    <>
      <Animated.View testID="launch-stage-page" style={[styles.page, !shown && hidden]}>
        {/* Its pieces wait, hidden, until the intro has gone; then they arrive (`Arrive`). */}
        <ArrivalContext.Provider value={shown ? "arriving" : "waiting"}>
          {children}
        </ArrivalContext.Provider>
      </Animated.View>
      <IntroFailSafe onFail={reveal}>
        <LaunchIntro revealed={revealed} onReveal={reveal} />
      </IntroFailSafe>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
});
