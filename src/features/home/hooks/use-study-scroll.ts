import { useContext, useRef, useState } from "react";
import type { View } from "react-native";
import {
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import {
  PARALLAX,
  getArtworkLift,
  getArtworkRect,
  getArtworkStretch,
  getBarProgress,
  getBarRange,
  getFlightRect,
  getSnapOffsets,
  getCollapse,
  getMastheadOpacity,
  type StudyScrollGeometry,
} from "../logic/study-scroll";

/** The plan bar's row, below the status bar, and its thumbnail — 16:9, its corners a little round. */
export const BAR_ROW_HEIGHT = 60;
export const BAR_THUMB = { width: 64, height: 36, radius: 8 };
/** The featured artwork's corners, which the flight eases into the thumbnail's. */
const ARTWORK_RADIUS = 16;

const UNMEASURED: StudyScrollGeometry = {
  artworkLeft: 0,
  artworkTop: 0,
  artworkWidth: 0,
  artworkHeight: 0,
  wordsTop: 0,
  continueTop: 0,
  mastheadTop: 0,
  barBottom: 0,
};

/**
 * Home's featured study answering the scroll (`logic/study-scroll`): the
 * artwork held back a little and stretching when pulled down; the words
 * and Continue collapsing up into the bar with the gesture, fading; the
 * masthead fading as the artwork reaches it; and the white plan bar coming
 * in, the artwork flying up into its thumbnail. Let go mid-way and
 * iOS glides it on to one end or the other (`snapOffsets`). Under Reduce
 * Motion nothing moves but the page: no parallax, stretch or flight — the bar
 * simply fades in.
 *
 * Give the scroll view `onScroll`, `snapOffsets`, `onContentSizeChange` and
 * `onScrollLayout`; the study its `artwork` and `words` (each a ref, a
 * measure-on-layout and a style); the masthead `mastheadStyle`; the bar
 * `barStyle`, `barThumbStyle` and `barTouchable`; the flying copy `flightStyle`.
 */
export function useStudyScroll() {
  const insetTop = useContext(SafeAreaInsetsContext)?.top ?? 0;
  const reduceMotion = useReduceMotion();
  const parallax = reduceMotion ? 0 : PARALLAX;
  const [geometry, setGeometry] = useState(UNMEASURED);
  const [extent, setExtent] = useState({ viewport: 0, content: 0 });
  const [barTouchable, setBarTouchable] = useState(false);
  const scrolled = useSharedValue(0);
  const artworkRef = useRef<View>(null);
  const wordsRef = useRef<View>(null);
  const continueRef = useRef<View>(null);
  const mastheadRef = useRef<View>(null);
  const barBottom = insetTop + BAR_ROW_HEIGHT;
  const thumb = {
    x: PAGE_INSET,
    y: insetTop + (BAR_ROW_HEIGHT - BAR_THUMB.height) / 2,
    width: BAR_THUMB.width,
    height: BAR_THUMB.height,
  };

  const onScroll = useAnimatedScrollHandler((event) => {
    scrolled.value = event.contentOffset.y;
  });

  // Crosses into React only when the bar starts or stops taking taps.
  useAnimatedReaction(
    () => getBarProgress(scrolled.value, geometry, parallax) >= 0.5,
    (touchable, previous) => {
      if (touchable !== previous) runOnJS(setBarTouchable)(touchable);
    },
    [geometry, parallax],
  );

  // Where they are at rest: measured in the window, less however far the page has scrolled.
  function measureArtwork() {
    artworkRef.current?.measureInWindow((x, y, width, height) => {
      const lift = getArtworkLift(scrolled.value, parallax);
      setGeometry((current) => ({
        ...current,
        artworkLeft: x,
        artworkTop: y + scrolled.value - lift,
        artworkWidth: width,
        artworkHeight: height,
        barBottom,
      }));
    });
  }
  function measureContinue() {
    continueRef.current?.measureInWindow((_x, y) => {
      setGeometry((current) => ({ ...current, continueTop: y + scrolled.value, barBottom }));
    });
  }
  // The masthead doesn't scroll: where it is is where it always is.
  function measureMasthead() {
    mastheadRef.current?.measureInWindow((_x, y) => {
      setGeometry((current) => ({ ...current, mastheadTop: y, barBottom }));
    });
  }
  function measureWords() {
    wordsRef.current?.measureInWindow((_x, y) => {
      setGeometry((current) => ({ ...current, wordsTop: y + scrolled.value, barBottom }));
    });
  }

  const artworkStyle = useAnimatedStyle(() => {
    const progress = reduceMotion ? 0 : getBarProgress(scrolled.value, geometry, parallax);
    return {
      // Hidden while its copy flies; a layer held back as it goes; grown from its foot when pulled down.
      opacity: progress > 0 ? 0 : 1,
      transform: [
        { translateY: getArtworkLift(scrolled.value, parallax) },
        { scale: reduceMotion ? 1 : getArtworkStretch(scrolled.value, geometry) },
      ],
    };
  });
  // The words, then Continue, collapsing up into the bar with the gesture: faster than the scroll, fading.
  const wordsStyle = useAnimatedStyle(() => {
    const { opacity, rise } = getCollapse(scrolled.value, geometry.wordsTop, geometry);
    return { opacity, transform: [{ translateY: reduceMotion ? 0 : rise }] };
  });
  const continueStyle = useAnimatedStyle(() => {
    const { opacity, rise } = getCollapse(scrolled.value, geometry.continueTop, geometry);
    return { opacity, transform: [{ translateY: reduceMotion ? 0 : rise }] };
  });
  // The wordmark and date fading as the artwork comes up to them.
  const mastheadStyle = useAnimatedStyle(() => ({
    opacity: getMastheadOpacity(scrolled.value, geometry, parallax),
  }));
  const barStyle = useAnimatedStyle(() => ({
    opacity: getBarProgress(scrolled.value, geometry, parallax),
  }));
  const barThumbStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion || getBarProgress(scrolled.value, geometry, parallax) >= 1 ? 1 : 0,
  }));
  const flightStyle = useAnimatedStyle(() => {
    const progress = getBarProgress(scrolled.value, geometry, parallax);
    const rect = getFlightRect(progress, getArtworkRect(scrolled.value, geometry, parallax), thumb);
    return {
      left: rect.x,
      top: rect.y,
      width: rect.width,
      height: rect.height,
      borderRadius: ARTWORK_RADIUS + (BAR_THUMB.radius - ARTWORK_RADIUS) * progress,
      opacity: !reduceMotion && progress > 0 && progress < 1 ? 1 : 0,
    };
  });

  return {
    insetTop,
    onScroll,
    snapOffsets: getSnapOffsets(
      getBarRange(geometry, parallax),
      Math.max(0, extent.content - extent.viewport),
    ),
    onContentSizeChange: (_width: number, height: number) =>
      setExtent((current) => ({ ...current, content: height })),
    onScrollLayout: (height: number) => setExtent((current) => ({ ...current, viewport: height })),
    /** For `FeaturedStudy`: its artwork and its words, each measured and moved. */
    artworkRef,
    onArtworkLayout: measureArtwork,
    artworkStyle,
    wordsRef,
    onWordsLayout: measureWords,
    wordsStyle,
    continueRef,
    onContinueLayout: measureContinue,
    continueStyle,
    /** For the masthead: measured where it sits, and fading as the artwork reaches it. */
    mastheadRef,
    onMastheadLayout: measureMasthead,
    mastheadStyle,
    barStyle,
    barThumbStyle,
    barTouchable,
    flightStyle,
  };
}
