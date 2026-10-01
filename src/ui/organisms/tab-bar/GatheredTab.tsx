import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";

import { useTheme } from "@/theme";
import { TAB_HEIGHT, TAB_ICON_SIZE } from "./tab-bar-geometry";

export type GatheredTabProps = {
  /** Whether the tabs are gathered into it — only then does it take taps. */
  minimized: boolean;
  /** The active tab's route and options. */
  routeName: string | undefined;
  options: BottomTabBarProps["descriptors"][string]["options"] | undefined;
  /** It comes and goes as the capsule gathers (`useTabBarMinimize`). */
  style: StyleProp<AnimatedStyle<ViewStyle>>;
  /** Opens the tabs out again. */
  onPress: () => void;
};

/**
 * The tabs gathered: just the active one, centred in the circle the capsule
 * becomes, on its highlight — the same height, and inset as far from the
 * capsule's edge, as the pill it is when open.
 */
export function GatheredTab({ minimized, routeName, options, style, onPress }: GatheredTabProps) {
  const theme = useTheme();

  return (
    <Animated.View
      pointerEvents={minimized ? "auto" : "none"}
      style={[StyleSheet.absoluteFill, style]}
    >
      <Pressable
        testID="tab-bar-collapsed"
        accessibilityRole="button"
        accessibilityLabel={typeof options?.title === "string" ? options.title : routeName}
        accessibilityHint="Shows the tabs"
        accessibilityState={{ selected: true }}
        pointerEvents={minimized ? "auto" : "none"}
        onPress={onPress}
        style={styles.gathered}
      >
        <View
          testID="tab-bar-collapsed-indicator"
          style={[styles.indicator, { backgroundColor: theme.colors.tabActiveBackground }]}
        />
        {options?.tabBarIcon?.({
          color: theme.colors.chromeIcon,
          size: TAB_ICON_SIZE,
          focused: true,
        })}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gathered: { flex: 1, alignItems: "center", justifyContent: "center" },
  indicator: {
    position: "absolute",
    width: TAB_HEIGHT,
    height: TAB_HEIGHT,
    borderRadius: TAB_HEIGHT / 2,
  },
});
