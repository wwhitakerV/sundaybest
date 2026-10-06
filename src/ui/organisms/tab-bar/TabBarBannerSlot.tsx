import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";

import { CAPSULE_HEIGHT, RAISE_GEOMETRY } from "./tab-bar-geometry";
import type { useTabBarBannerReveal } from "./use-tab-bar-raise";

export type TabBarBannerSlotProps = {
  banner: ReactNode;
  /** Whether it's up; it takes touches only then. */
  shown: boolean;
  /** Its slide up and back (`useTabBarBannerReveal`). */
  style: ReturnType<typeof useTabBarBannerReveal>;
};

/**
 * The raised place above the tabs, the bar's full width, where a banner
 * floats (the plan being built). The tab bar draws it beneath the tabs'
 * capsule, so it slides up out from behind them and back, never over them.
 */
export function TabBarBannerSlot({ banner, shown, style }: TabBarBannerSlotProps) {
  return (
    <Animated.View
      testID="tab-bar-banner"
      pointerEvents={shown ? "box-none" : "none"}
      style={[styles.banner, style]}
    >
      {banner}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: RAISE_GEOMETRY.raised.top,
    left: 0,
    right: 0,
    height: CAPSULE_HEIGHT,
  },
});
