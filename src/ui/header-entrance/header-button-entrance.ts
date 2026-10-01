import { Easing, withDelay, withSpring, withTiming } from "react-native-reanimated";

import type { HeaderSide } from "./header-side";

/** Waits for the screen to be most of the way in, so the buttons land with it. */
const DELAY_MS = 120;
/** Close to full size already: a settle, not a pop. */
const START_SCALE = 0.8;
/** How far outside its place it starts, toward its own edge of the screen. */
const SLIDE_IN = 11;
const FADE_MS = 180;
/** Just under-damped: a hair past its place, then still. */
const SPRING = { damping: 15, stiffness: 260, mass: 0.7 };

/**
 * A header button arriving with its screen, after iOS's own bar buttons:
 * it fades in, slides the last few points in from its own edge, and grows
 * the last little way to full size, with a faint spring at the end. Returns
 * a Reanimated entering animation (a worklet); `withSpring` and `withTiming`
 * follow the system Reduce Motion setting, so with it on the button is just
 * there.
 */
export function headerButtonEntrance(side: HeaderSide) {
  const startX = side === "leading" ? -SLIDE_IN : SLIDE_IN;

  return () => {
    "worklet";
    return {
      initialValues: {
        opacity: 0,
        transform: [{ translateX: startX }, { scale: START_SCALE }],
      },
      animations: {
        opacity: withDelay(
          DELAY_MS,
          withTiming(1, { duration: FADE_MS, easing: Easing.out(Easing.cubic) }),
        ),
        transform: [
          { translateX: withDelay(DELAY_MS, withSpring(0, SPRING)) },
          { scale: withDelay(DELAY_MS, withSpring(1, SPRING)) },
        ],
      },
    };
  };
}
