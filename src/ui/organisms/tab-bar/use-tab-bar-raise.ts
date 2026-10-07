import { useEffect } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";

/** A touch under-damped: the button settles into its new place with a small give. */
const RAISE_SPRING = { damping: 16, stiffness: 170, mass: 0.9 };

/** Where the screen's button sits in the tab bar, from the bar's top left and right. */
type AccessorySlot = { top: number; left: number; right: number };

export type TabBarRaiseGeometry = {
  /** Beside the gathered tabs, between them and the FAB. */
  beside: AccessorySlot;
  /** Above the open tabs, the bar's whole width. */
  raised: AccessorySlot;
  /** The FAB's scale while something's raised above the open tabs — the capsule's height over its own. */
  fabScale: number;
  /** How much higher the button sits raised — and the tint behind the bar reaches. */
  lift: number;
  /** How far the FAB drops to leave the bar: below the screen's bottom edge. */
  fabDrop: number;
};

/** What's raised above the tabs, which decides each part's place. */
export type TabBarRaiseState = {
  /** The screen's button rises from beside the gathered tabs to above the open ones. */
  buttonRaised: boolean;
  /** Something sits above the open tabs: the FAB shrinks to the capsule's height beside them. */
  fabShrunk: boolean;
  /** Something sits above the tabs: the tint behind the bar reaches up behind it. */
  tintRaised: boolean;
  /** A screen has no use for the FAB: it drops down out of the bar, and the button beside the tabs takes its room. */
  fabHidden: boolean;
};

function mix(from: number, to: number, progress: number): number {
  "worklet";
  return from + (to - from) * progress;
}

function clamp01(value: number): number {
  "worklet";
  return Math.min(1, Math.max(0, value));
}

/** A 0–1 value that springs to `on` whenever it changes; it follows the system Reduce Motion setting. */
function useSpringProgress(on: boolean): SharedValue<number> {
  const progress = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    progress.set(withSpring(on ? 1 : 0, RAISE_SPRING));
  }, [on, progress]);
  return progress;
}

/**
 * Something rising above the tab bar's tabs: a screen's button, from beside
 * the gathered tabs to above the open ones, widening to the bar's full width;
 * or a banner above them. While either sits above the open tabs the FAB
 * shrinks to the capsule's height beside them, and the tint behind the bar
 * reaches up behind whatever's raised. On a screen with no use for the FAB
 * it drops down out of the bar, fading, and springs back up after — on the
 * bar's own spring, so it moves as the rest of the bar does — while the button
 * beside the gathered tabs reaches into its room. Each part springs on its own.
 */
export function useTabBarRaise(state: TabBarRaiseState, geometry: TabBarRaiseGeometry) {
  const button = useSpringProgress(state.buttonRaised);
  const fab = useSpringProgress(state.fabShrunk);
  const tint = useSpringProgress(state.tintRaised);
  const gone = useSpringProgress(state.fabHidden);
  const { beside, fabScale, lift, fabDrop } = geometry;
  const up = geometry.raised;

  const slotStyle = useAnimatedStyle(() => ({
    top: mix(beside.top, up.top, button.value),
    left: mix(beside.left, up.left, button.value),
    // Beside the gathered tabs it stops short of the FAB — or, the FAB gone, runs to the edge.
    right: mix(mix(beside.right, 0, gone.value), up.right, button.value),
  }));
  const fabStyle = useAnimatedStyle(() => ({
    // `+ 0` so a FAB at rest sits at 0, not −0.
    opacity: clamp01(1 - gone.value),
    transform: [{ translateY: gone.value * fabDrop + 0 }, { scale: mix(1, fabScale, fab.value) }],
  }));
  // The tint's drawn tall enough for what's raised and held down out of
  // sight by the difference — rising into view as it does.
  const tintStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: mix(lift, 0, tint.value) }],
  }));

  return { slotStyle, fabStyle, tintStyle };
}

/**
 * A banner above the tabs, sliding up from behind them as it arrives and
 * back down as it goes; it follows the system Reduce Motion setting.
 */
export function useTabBarBannerReveal(shown: boolean, lift: number) {
  const progress = useSpringProgress(shown);
  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: mix(lift, 0, progress.value) }],
  }));
}
