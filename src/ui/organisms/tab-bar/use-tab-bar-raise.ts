import { useEffect } from "react";
import { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

/** A touch under-damped: the button settles into its new place with a small give. */
const RAISE_SPRING = { damping: 16, stiffness: 170, mass: 0.9 };

/** Where the screen's button sits in the tab bar, from the bar's top left and right. */
type AccessorySlot = { top: number; left: number; right: number };

export type TabBarRaiseGeometry = {
  /** Beside the gathered tabs, between them and the FAB. */
  beside: AccessorySlot;
  /** Above the open tabs, the bar's whole width. */
  raised: AccessorySlot;
  /** The FAB's scale while the button's raised — the capsule's height over its own. */
  fabScale: number;
  /** How much higher the button sits raised — and the tint behind the bar reaches. */
  lift: number;
};

function mix(from: number, to: number, progress: number): number {
  "worklet";
  return from + (to - from) * progress;
}

/**
 * A minimised tab bar opened back out while the screen's button is still
 * wanted: the button rises from beside the gathered tabs to above the open
 * ones, widening to the bar's full width; the FAB shrinks to the capsule's
 * height beside it; and the tint behind the bar reaches up behind the
 * button. A spring, fired whenever `raised` changes; it follows the system
 * Reduce Motion setting.
 */
export function useTabBarRaise(raised: boolean, geometry: TabBarRaiseGeometry) {
  const progress = useSharedValue(raised ? 1 : 0);
  const { beside, fabScale, lift } = geometry;
  const up = geometry.raised;

  useEffect(() => {
    progress.set(withSpring(raised ? 1 : 0, RAISE_SPRING));
  }, [raised, progress]);

  const slotStyle = useAnimatedStyle(() => ({
    top: mix(beside.top, up.top, progress.value),
    left: mix(beside.left, up.left, progress.value),
    right: mix(beside.right, up.right, progress.value),
  }));
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mix(1, fabScale, progress.value) }],
  }));
  // The tint's drawn tall enough for the raised button and held down out of
  // sight by the difference — rising into view as the button does.
  const tintStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: mix(lift, 0, progress.value) }],
  }));

  return { slotStyle, fabStyle, tintStyle };
}
