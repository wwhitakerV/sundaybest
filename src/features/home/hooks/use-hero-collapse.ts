import { useContext, useState } from "react";
import { useWindowDimensions, type LayoutChangeEvent } from "react-native";
import {
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { PAGE_INSET } from "@/ui/Screen";
import {
  BAR_ROW_HEIGHT,
  BAR_THUMB_RADIUS,
  HERO_ARTWORK_RADIUS,
  HERO_ARTWORK_WIDTH_RATIO,
  HERO_BREATHE_BOTTOM,
  HERO_BREATHE_TOP,
  getArtworkRect,
  getBarProgress,
  getBarThumbRect,
  getCollapseGeometry,
  getCollapsePhase,
  getCollapseProgress,
  getFlightRect,
  getHeaderOpacity,
  getHeroContentOpacity,
  getHeroCornerRadius,
  getHeroPin,
  getSnapOffsets,
  isHeroMeasurable,
  type CollapsePhase,
} from "../logic/hero-collapse";

/** How far into the scroll view Home's content starts. */
export const CONTENT_TOP = 8;
/**
 * Where things sit until they're measured: the header's icon button and the
 * gap below it — and no hero height yet, so nothing collapses before it's known.
 */
const LAYOUT_ESTIMATE = {
  headerBottom: 12 + 49,
  scrollTop: 12 + 49 + 16,
  heroContentHeight: 0,
  // The scroll view's height and its content's, for how far the page scrolls.
  viewportHeight: 0,
  contentHeight: 0,
};

const HEADER_TOUCHABLE = 1;
const BAR_TOUCHABLE = 2;
const LIGHT_STATUS_BAR = 4;

/** A phase as bits, so the scroll only reaches React when one changes. */
function toBits(phase: CollapsePhase): number {
  "worklet";
  return (
    (phase.headerTouchable ? HEADER_TOUCHABLE : 0) |
    (phase.barTouchable ? BAR_TOUCHABLE : 0) |
    (phase.lightStatusBar ? LIGHT_STATUS_BAR : 0)
  );
}

/**
 * Home's featured plan collapsing into the plan bar, tied to the scroll
 * (`logic/hero-collapse`): the header fades, the hero's corners straighten
 * then it holds at the top and shortens point for point with the scroll as
 * its content gives way, its artwork flies up into the bar's thumbnail, and
 * the bar comes in — all on the UI thread, reversing on the way back. Let
 * go where it would stop mid-collapse and iOS glides it on to fully open or
 * fully in; a flick that would carry past the collapse coasts on as it
 * would (`snapOffsets`).
 *
 * Give the scroll view `onScroll`, `onContentSizeChange`, and `snapOffsets`;
 * measure the header, the
 * scroll view, and the hero's content with `onHeaderLayout`,
 * `onScrollLayout`, and `onHeroContentLayout`, and give the hero
 * `heroSlotHeight` so it keeps its room in the page. `phase` says
 * what takes taps and whether the status bar should be light, and only
 * changes at those points.
 */
export function useHeroCollapse() {
  const insetTop = useContext(SafeAreaInsetsContext)?.top ?? 0;
  const { width: screenWidth } = useWindowDimensions();
  const [layout, setLayout] = useState(LAYOUT_ESTIMATE);
  const heroHeight =
    layout.heroContentHeight > 0
      ? layout.heroContentHeight + HERO_BREATHE_TOP + HERO_BREATHE_BOTTOM
      : 0;
  const geometry = getCollapseGeometry({
    insetTop,
    headerBottom: layout.headerBottom,
    scrollTop: layout.scrollTop,
    contentTop: CONTENT_TOP,
    heroHeight,
    barHeight: insetTop + BAR_ROW_HEIGHT,
  });
  const scrolled = useSharedValue(0);
  const [phaseBits, setPhaseBits] = useState(toBits(getCollapsePhase(0, geometry)));

  const frame = {
    screenWidth,
    inset: PAGE_INSET,
    widthRatio: HERO_ARTWORK_WIDTH_RATIO,
    breatheTop: HERO_BREATHE_TOP,
  };
  const barThumb = getBarThumbRect(insetTop, PAGE_INSET);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrolled.value = event.contentOffset.y;
  });

  // Crosses into React only when what takes taps, or the status bar, changes.
  useAnimatedReaction(
    () => toBits(getCollapsePhase(scrolled.value, geometry)),
    (bits, previous) => {
      if (bits !== previous) runOnJS(setPhaseBits)(bits);
    },
    [geometry],
  );

  const headerStyle = useAnimatedStyle(() => ({
    opacity: getHeaderOpacity(scrolled.value, geometry),
  }));
  // Rounded until it nears the top; then held there against the scroll and
  // a point shorter for every point scrolled, down to the bar's height.
  const heroFrameStyle = useAnimatedStyle(() => {
    const radius = getHeroCornerRadius(scrolled.value, geometry);
    const corners = { borderTopLeftRadius: radius, borderTopRightRadius: radius };
    if (heroHeight === 0) return corners;
    const pin = getHeroPin(scrolled.value, geometry);
    return { ...corners, height: pin.height, transform: [{ translateY: pin.offset }] };
  });
  const heroContentStyle = useAnimatedStyle(() => ({
    opacity: getHeroContentOpacity(scrolled.value, geometry),
  }));
  const barStyle = useAnimatedStyle(() => ({
    opacity: getBarProgress(scrolled.value, geometry),
  }));

  // The artwork's flight: the copy shows only on the way, while the hero's
  // artwork and the bar's thumbnail — which it sits exactly on at either
  // end — hide.
  const flightStyle = useAnimatedStyle(() => {
    const progress = getCollapseProgress(scrolled.value, geometry);
    const rect = getFlightRect(progress, getArtworkRect(scrolled.value, geometry, frame), barThumb);
    return {
      left: rect.x,
      top: rect.y,
      width: rect.width,
      height: rect.height,
      borderRadius: HERO_ARTWORK_RADIUS + (BAR_THUMB_RADIUS - HERO_ARTWORK_RADIUS) * progress,
      opacity: progress > 0 && progress < 1 ? 1 : 0,
    };
  });
  const heroArtworkStyle = useAnimatedStyle(() => ({
    opacity: getCollapseProgress(scrolled.value, geometry) > 0 ? 0 : 1,
  }));
  const barThumbStyle = useAnimatedStyle(() => ({
    opacity: getCollapseProgress(scrolled.value, geometry) < 1 ? 0 : 1,
  }));

  function onHeaderLayout(event: LayoutChangeEvent) {
    const { y, height } = event.nativeEvent.layout;
    setLayout((current) => ({ ...current, headerBottom: y + height }));
  }
  function onHeroContentLayout(event: LayoutChangeEvent) {
    // Only while the hero's whole: mid-collapse, a measurement would change
    // the collapse it's taken during.
    if (!isHeroMeasurable(scrolled.value, geometry)) return;
    const { height } = event.nativeEvent.layout;
    setLayout((current) => ({ ...current, heroContentHeight: height }));
  }
  function onScrollLayout(event: LayoutChangeEvent) {
    const { y, height } = event.nativeEvent.layout;
    setLayout((current) => ({ ...current, scrollTop: y, viewportHeight: height }));
  }
  function onContentSizeChange(_width: number, height: number) {
    setLayout((current) => ({ ...current, contentHeight: height }));
  }

  return {
    insetTop,
    snapOffsets: getSnapOffsets(
      geometry,
      Math.max(0, layout.contentHeight - layout.viewportHeight),
    ),
    onContentSizeChange,
    onScroll,
    onHeaderLayout,
    onScrollLayout,
    onHeroContentLayout,
    heroSlotHeight: heroHeight > 0 ? heroHeight : undefined,
    headerStyle,
    heroFrameStyle,
    heroContentStyle,
    barStyle,
    flightStyle,
    heroArtworkStyle,
    barThumbStyle,
    phase: {
      headerTouchable: (phaseBits & HEADER_TOUCHABLE) !== 0,
      barTouchable: (phaseBits & BAR_TOUCHABLE) !== 0,
      lightStatusBar: (phaseBits & LIGHT_STATUS_BAR) !== 0,
    },
  };
}
