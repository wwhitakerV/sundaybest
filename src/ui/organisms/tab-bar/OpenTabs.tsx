import { useState } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";

import { useTheme } from "@/theme";
import { TabButton } from "./TabButton";
import {
  CAPSULE_H_PADDING,
  CAPSULE_V_PADDING,
  TAB_HEIGHT,
  TAB_PILL_RADIUS,
} from "./tab-bar-geometry";
import { useTabIndicator, type TabLayout } from "./use-tab-indicator";

export type OpenTabsProps = Pick<BottomTabBarProps, "state" | "descriptors"> & {
  /** Whether the tabs are gathered away — then they take no taps. */
  minimized: boolean;
  /** They give way as the capsule gathers (`useTabBarMinimize`). */
  style: StyleProp<AnimatedStyle<ViewStyle>>;
  onPressTab: (routeKey: string, routeName: string, isActive: boolean) => void;
};

/**
 * The bar's tabs, open: each flexing to share the row's inner width evenly
 * (not a fixed square), with the active one's highlight a single shared pill
 * that springs to its measured place (`useTabIndicator`) rather than a
 * per-tab background — so it stays flush with its tab at any width or
 * spacing.
 *
 * The row carries all the capsule's inset, and both the pill and the tabs
 * are its children. That's deliberate: an absolutely positioned pill's
 * `left`/`top` and an in-flow tab's `onLayout` position can resolve against
 * subtly different reference boxes of the *same* parent depending on that
 * parent's own border/padding, which is exactly what caused this to drift
 * out of alignment twice before. One shared, borderless parent for both
 * means `left: 0`/`top: 0` on the pill and `onLayout`'s `x`/`width` on a tab
 * are the same coordinate frame.
 */
export function OpenTabs({ state, descriptors, minimized, style, onPressTab }: OpenTabsProps) {
  const theme = useTheme();
  const [tabLayouts, setTabLayouts] = useState<Record<string, TabLayout>>({});
  const indicatorStyle = useTabIndicator(tabLayouts[state.routes[state.index]?.key ?? ""]);

  return (
    <Animated.View pointerEvents={minimized ? "none" : "auto"} style={[styles.row, style]}>
      <Animated.View
        testID="tab-bar-indicator"
        style={[
          styles.indicator,
          { backgroundColor: theme.colors.tabActiveBackground },
          indicatorStyle,
        ]}
      />
      {state.routes.map((route, index) => {
        const options = descriptors[route.key]?.options;
        // A screen declared with `<Tabs.Screen options={{ href: null }} />`
        // is unwound by Expo Router into `tabBarButton: () => null` before
        // this custom `tabBar` ever sees it, since that's the hook the stock
        // tab bar UI would consult. This bar owns its own rendering instead,
        // so it reads that same marker to skip the route entirely.
        if (!options || options.tabBarButton) return null;
        const isActive = state.index === index;

        return (
          <TabButton
            key={route.key}
            routeName={route.name}
            options={options}
            active={isActive}
            onLayout={(layout) =>
              setTabLayouts((previous) => ({ ...previous, [route.key]: layout }))
            }
            onPress={() => onPressTab(route.key, route.name, isActive)}
          />
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: CAPSULE_H_PADDING,
    paddingVertical: CAPSULE_V_PADDING,
  },
  indicator: {
    position: "absolute",
    left: 0,
    top: CAPSULE_V_PADDING - 1,
    height: TAB_HEIGHT,
    borderRadius: TAB_PILL_RADIUS,
  },
});
