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
  getPullZoom,
  hasHeroCleared,
  isContinueHandedOff,
} from "../logic/plan-parallax";

/** How quickly Continue fades as it hands over to the tab bar, and back. */
const HANDOFF_FADE_MS = 160;
/** How quickly the nav buttons fade between the hero's look and the page's. */
const NAV_FADE_MS = 180;

/**
 * Plan Detail's hero as the page scrolls (`logic/plan-parallax`): the artwork
 * held back, rising at half the rate, fading slowly and shrinking more
 * slowly still, to 85%; and Continue handing over to the tab bar once it's
 * scrolled up level with the nav buttons (`navTop`, down the screen) —
 * fading out as the tab bar takes it, and back in scrolling down.
 * Pulled down past the top, the hero's colour zooms from its foot to keep
 * reaching the top of the screen (`colourStyle`), while the artwork moves
 * with the words, the same distance above them, as one. Measure the hero with
 * `onHeroLayout` and Continue with `onContinueLayout`.
 *
 * Once the hero's bottom edge has scrolled up past the nav buttons
 * (`navLine`, down the screen), they're over the page: `navOverPage`, and
 * the two looks cross-fade (`heroNavStyle`, `pageNavStyle`). The status bar
 * the same, as the edge passes `statusBarLine` (`statusBarOverPage`).
 * `handedOff` and these only change at those points, so the scroll reaches
 * React no more than it must.
 */
export function usePlanHeroScroll({
  navTop,
  navLine,
  statusBarLine,
}: {
  navTop: number;
  navLine: number;
  statusBarLine: number;
}) {
  const [continueTop, setContinueTop] = useState(0);
  const [heroHeight, setHeroHeight] = useState(0);
  const [handedOff, setHandedOff] = useState(false);
  const [navOverPage, setNavOverPage] = useState(false);
  const [statusBarOverPage, setStatusBarOverPage] = useState(false);
  const navFade = useSharedValue(0);
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

  useAnimatedReaction(
    () => hasHeroCleared(scrolled.value, heroHeight, navLine),
    (now, before) => {
      if (now === before) return;
      navFade.value = withTiming(now ? 1 : 0, { duration: NAV_FADE_MS });
      runOnJS(setNavOverPage)(now);
    },
    [heroHeight, navLine],
  );
  useAnimatedReaction(
    () => hasHeroCleared(scrolled.value, heroHeight, statusBarLine),
    (now, before) => {
      if (now !== before) runOnJS(setStatusBarOverPage)(now);
    },
    [heroHeight, statusBarLine],
  );

  const artworkStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: getArtworkDrift(scrolled.value) },
      { scale: getArtworkScale(scrolled.value) },
    ],
    opacity: getArtworkOpacity(scrolled.value),
  }));
  const continueStyle = useAnimatedStyle(() => ({ opacity: continueOpacity.value }));
  const heroNavStyle = useAnimatedStyle(() => ({ opacity: 1 - navFade.value }));
  const pageNavStyle = useAnimatedStyle(() => ({ opacity: navFade.value }));
  const colourStyle = useAnimatedStyle(() => ({
    transform: [{ scale: getPullZoom(scrolled.value, heroHeight) }],
  }));

  function onContinueLayout(event: LayoutChangeEvent) {
    setContinueTop(event.nativeEvent.layout.y);
  }
  function onHeroLayout(event: LayoutChangeEvent) {
    setHeroHeight(event.nativeEvent.layout.height);
  }

  return {
    onScroll,
    artworkStyle,
    continueStyle,
    colourStyle,
    onContinueLayout,
    onHeroLayout,
    heroHeight,
    handedOff,
    heroNavStyle,
    pageNavStyle,
    navOverPage,
    statusBarOverPage,
  };
}
