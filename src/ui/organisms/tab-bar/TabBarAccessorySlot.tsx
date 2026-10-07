import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";

import { FloatingButton } from "@/ui/atoms/FloatingButton";
import type { TabBarAccessory } from "./tab-bar-accessory";
import { CAPSULE_HEIGHT } from "./tab-bar-geometry";

export type TabBarAccessorySlotProps = {
  /** The screen's button — the last one asked for, kept while it springs away. */
  accessory: TabBarAccessory;
  /** Whether a screen's still asking for it: it only takes touches then. */
  shown: boolean;
  /** Where it sits and how it springs (`useTabBarRaise`, `useTabBarMinimize`). */
  style: StyleProp<AnimatedStyle<ViewStyle>>;
};

/** A screen's button in the tab bar: beside the gathered tabs, or raised above the open ones. */
export function TabBarAccessorySlot({ accessory, shown, style }: TabBarAccessorySlotProps) {
  return (
    <Animated.View
      testID="tab-bar-accessory-slot"
      pointerEvents={shown ? "auto" : "none"}
      style={[styles.slot, style]}
    >
      <FloatingButton
        testID={accessory.testID}
        label={accessory.label}
        {...(accessory.icon && { icon: accessory.icon })}
        {...(accessory.waiting && { waiting: true })}
        onPress={accessory.onPress}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Placed by `useTabBarRaise`. Always given a `top`: without one it's
  // centred on the whole bar, padding and all, and sits low.
  slot: {
    position: "absolute",
    height: CAPSULE_HEIGHT,
  },
});
