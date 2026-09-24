import { useCallback, useEffect, useState, type ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/theme";
import { NAVIGATION_MS } from "../logic/scenes";
import { ArrivalContext } from "./mocks/arrival-context";

/** On a push, the screen being left drifts this share of the width to the left, as on iOS. */
const PUSH_LEAVING_SHIFT = 0.3;
const NAVIGATION_EASING = Easing.out(Easing.cubic);

/** How the phone arrives at a new screen: pushed from the right, presented from below, or cut to. */
export type PhoneNavigation = "push" | "modal" | "cut";

type PaneProps = {
  /** How this screen arrived — fixed when it mounts. */
  arrival: PhoneNavigation;
  /** How the screen replacing it arrives, once it's being left; null while it's current. */
  departure: PhoneNavigation | null;
  width: number;
  height: number;
  /** Called once it has finished arriving. */
  onArrived: () => void;
  children: ReactNode;
};

/**
 * One screen in the phone, with its own motion. It's mounted already where
 * its arrival starts — off to the right for a push, below for a modal — so
 * the very first frame drawn is right, rather than flashing in place before
 * an effect moves it. While a pushed screen replaces it, it drifts left.
 */
function Pane({ arrival, departure, width, height, onArrived, children }: PaneProps) {
  const theme = useTheme();
  const [arrivedBy] = useState(arrival);
  const [arriving, setArriving] = useState(arrivedBy !== "cut");
  // 0 = where its arrival starts, 1 = in place.
  const entered = useSharedValue(arrivedBy === "cut" ? 1 : 0);
  // 0 = in place, 1 = fully drifted aside by a push over it.
  const drifted = useSharedValue(0);

  const finishArriving = useCallback(() => {
    setArriving(false);
    onArrived();
  }, [onArrived]);

  useEffect(() => {
    if (arrivedBy === "cut") return;
    const duration = arrivedBy === "modal" ? NAVIGATION_MS.modal : NAVIGATION_MS.push;
    entered.value = withTiming(1, { duration, easing: NAVIGATION_EASING }, (finished) => {
      if (finished) runOnJS(finishArriving)();
    });
  }, [arrivedBy, entered, finishArriving]);

  useEffect(() => {
    if (departure !== "push") return;
    drifted.value = withTiming(1, { duration: NAVIGATION_MS.push, easing: NAVIGATION_EASING });
  }, [departure, drifted]);

  const style = useAnimatedStyle(() => {
    const remaining = 1 - entered.value;
    return {
      transform: [
        {
          translateX:
            (arrivedBy === "push" ? remaining * width : 0) -
            drifted.value * width * PUSH_LEAVING_SHIFT,
        },
        { translateY: arrivedBy === "modal" ? remaining * height : 0 },
      ],
    };
  });

  return (
    <Animated.View style={[styles.screen, { backgroundColor: theme.colors.background }, style]}>
      <ArrivalContext.Provider value={arriving}>{children}</ArrivalContext.Provider>
    </Animated.View>
  );
}

export type ScreenPushProps<Key extends string> = {
  /** The screen to show. */
  screenKey: Key;
  /** How to get there when `screenKey` changes. */
  navigation: PhoneNavigation;
  /** The size the screens slide across. */
  width: number;
  height: number;
  renderScreen: (key: Key) => ReactNode;
};

/**
 * The phone's own navigation, moving between screens the way the real app
 * does: a push slides the new screen in from the right while the old one
 * drifts left; a full-screen modal slides up over the old one, which stays.
 * Screens only ever translate, never scale, so their text stays sharp.
 * Stepping within a screen isn't navigation — the screen does that itself.
 */
export function ScreenPush<Key extends string>({
  screenKey,
  navigation,
  width,
  height,
  renderScreen,
}: ScreenPushProps<Key>) {
  const [shown, setShown] = useState<{ key: Key; arrival: PhoneNavigation }>({
    key: screenKey,
    arrival: "cut",
  });
  const [leaving, setLeaving] = useState<{ key: Key; navigation: PhoneNavigation } | null>(null);
  if (screenKey !== shown.key) {
    setLeaving(navigation === "cut" ? null : { key: shown.key, navigation });
    setShown({ key: screenKey, arrival: navigation });
  }
  const clearLeaving = useCallback(() => setLeaving(null), []);

  // Keyed by screen, so the screen being left keeps its place in the tree
  // (and its state) as it goes from current to leaving.
  return (
    <>
      {leaving !== null && (
        <Pane
          key={leaving.key}
          arrival="cut"
          departure={leaving.navigation}
          width={width}
          height={height}
          onArrived={clearLeaving}
        >
          {renderScreen(leaving.key)}
        </Pane>
      )}
      <Pane
        key={shown.key}
        arrival={shown.arrival}
        departure={null}
        width={width}
        height={height}
        onArrived={clearLeaving}
      >
        {renderScreen(shown.key)}
      </Pane>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { ...StyleSheet.absoluteFill },
});
