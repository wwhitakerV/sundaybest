import { useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import {
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import {
  getArtworkDrift,
  getArtworkOpacity,
  getArtworkScale,
  isContinueHandedOff,
} from "../logic/plan-parallax";

/** How quickly Continue fades as it hands over to the tab bar, and back. */
const HANDOFF_FADE_MS = 160;

/**
 * Plan Detail's hero as the page scrolls (`logic/plan-parallax`): the artwork
 * held back, rising at half the rate, fading slowly and shrinking more
 * slowly still, to 85%; and Continue handing over to the tab bar once it's
 * scrolled up level with the nav buttons (`navTop`, down the screen) —
 * fading out as the tab bar takes it, and back in scrolling down.
 * Measure Continue with `onContinueLayout`. `handedOff` only changes at that
 * point, so the scroll reaches React no more than it must.
 */
export function usePlanHeroScroll(navTop: number) {
  const [continueTop, setContinueTop] = useState(0);
  const [handedOff, setHandedOff] = useState(false);
  const scrolled = useSharedValue(0);
  const continueOpacity = useSharedValue(1);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrolled.value = event.contentOffset.y;
  });

  useAnimatedReaction(
    () => isContinueHandedOff(scrolled.value, continueTop, navTop),
    (now, before) => {
      if (now === before) return;
      continueOpacity.value = withTiming(now ? 0 : 1, { duration: HANDOFF_FADE_MS });
      runOnJS(setHandedOff)(now);
    },
    [continueTop, navTop],
  );

  const artworkStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: getArtworkDrift(scrolled.value) },
      { scale: getArtworkScale(scrolled.value) },
    ],
    opacity: getArtworkOpacity(scrolled.value),
  }));
  const continueStyle = useAnimatedStyle(() => ({ opacity: continueOpacity.value }));

  function onContinueLayout(event: LayoutChangeEvent) {
    setContinueTop(event.nativeEvent.layout.y);
  }

  return { onScroll, artworkStyle, continueStyle, onContinueLayout, handedOff };
}
