import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { useRouter } from "expo-router";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
// Not re-exported from the top-level `expo-router` module, but this is the
// same internal path expo-router's own `TabsClient.d.ts` imports
// `BottomTabNavigationOptions` from — no `exports` map in expo-router's
// package.json restricts it, so it's a stable subpath, not a private one.
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { Plus } from "lucide-react-native";

import { useTheme } from "@/theme";
import { FLOATING_NAV_BAR } from "./floatingNavBar";
import { useTabBarVisible } from "./TabBarVisibility";

export type TabBarProps = BottomTabBarProps & {
  /** Called on every tab and FAB press, before navigation. */
  onPress?: () => void;
};

const {
  capsuleHeight: CAPSULE_HEIGHT,
  capsuleRadius: CAPSULE_RADIUS,
  capsuleHPadding: CAPSULE_H_PADDING,
  capsuleVPadding: CAPSULE_V_PADDING,
  sideMargin: SIDE_MARGIN,
  bottomMargin: BOTTOM_MARGIN,
} = FLOATING_NAV_BAR;
const GAP_TO_FAB = 10;
const TAB_HEIGHT = CAPSULE_HEIGHT - CAPSULE_V_PADDING * 2;
const TAB_PILL_RADIUS = CAPSULE_RADIUS - CAPSULE_H_PADDING;
const TAB_ICON_SIZE = 23;
const FAB_SIZE = 66;
const FAB_RADIUS = 33;
const FAB_ICON_SIZE = 26;
const FAB_STROKE_WIDTH = 2.5;
const INDICATOR_SPRING = { damping: 18, stiffness: 220, mass: 0.7 };
const VISIBILITY_DROP_DISTANCE = 24;
// "Super fast and springy": high stiffness snaps it out of view almost
// immediately, and the lower damping relative to INDICATOR_SPRING gives it
// a touch of overshoot on the way back in rather than a dead stop.
const VISIBILITY_SPRING = { damping: 14, stiffness: 400, mass: 0.6 };

type TabLayout = { x: number; width: number };

/**
 * The floating pill tab bar, plus the add-sermon FAB beside it. Passed to
 * `Tabs` as `screenOptions={{ tabBar: (props) => <TabBar {...props} /> }}`
 * — Expo Router's `Tabs` supports a fully custom `tabBar` render prop
 * (confirmed against `BottomTabBarProps`'s type export), which is what lets
 * this render as a floating capsule rather than the stock edge-to-edge bar.
 *
 * The FAB is not a fifth `Tabs.Screen` — it always navigates to
 * `/(plan-creation)/paste-sermon` via `useRouter()`, a sibling route group
 * to `(tabs)` at the root Stack, not a route inside this tab navigator, so
 * it uses the router directly rather than the tab navigator's own
 * `navigation` prop.
 *
 * Each tab flexes to share the row's inner width evenly (not a fixed
 * square). The active-tab highlight is one shared pill that springs to
 * each tab's measured position instead of a per-tab background, so it
 * stays flush with its tab at any width or spacing.
 *
 * `capsule` itself carries no padding — only its border, radius, and
 * height. All of the inset (`CAPSULE_H_PADDING`/`_V_PADDING`) lives on
 * `innerRow`, an in-flow child with no border of its own, and both the
 * pill and the tabs are its children. That was deliberate: an absolutely
 * positioned pill's `left`/`top` and an in-flow tab's `onLayout` position
 * can resolve against subtly different reference boxes of the *same*
 * parent depending on that parent's own border/padding, which is exactly
 * what caused this to drift out of alignment twice before. Giving the
 * pill and the tabs one shared, borderless, padding-free parent removes
 * the ambiguity outright — both are measured against `innerRow`'s content
 * box, full stop, so `left: 0`/`top: 0` on the pill and `onLayout`'s
 * `x`/`width` on a tab are guaranteed to be the same coordinate frame.
 *
 * Position/size are held in shared values and driven by `withSpring` on
 * layout change, so a rapid re-tap re-targets the in-flight spring
 * smoothly instead of restarting a timing curve. `withSpring` defaults
 * `reduceMotion` to `ReduceMotion.System`, so a viewer with reduce-motion
 * enabled gets the indicator's final position with no animation, with no
 * extra wiring here.
 *
 * `onPress` fires on every tab and FAB press, before navigation — this
 * component has no side-effect SDK access of its own (`ui` never imports
 * `core`), so haptic feedback is the caller's job; `(tabs)/_layout.tsx`
 * passes `tapFeedback` from `@/core/haptics`.
 *
 * `useTabBarVisible()` (`TabBarVisibility.tsx`) lets a screen elsewhere in
 * the tree — the study flow's `StudyNav` screens — hide this bar in its
 * own favour. Hidden, it fades out and drops a short distance with a fast,
 * springy motion, `pointerEvents="none"` so it can't intercept touches
 * meant for whatever replaced it, and comes back the same way.
 */
export function TabBar({ state, descriptors, navigation, insets, onPress }: TabBarProps) {
  const theme = useTheme();
  const router = useRouter();
  const [tabLayouts, setTabLayouts] = useState<Record<string, TabLayout>>({});
  const visible = useTabBarVisible();

  const activeLayout = tabLayouts[state.routes[state.index]?.key ?? ""];
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const indicatorOpacity = useSharedValue(0);
  const visibility = useSharedValue(1);

  useEffect(() => {
    if (!activeLayout) return;
    indicatorX.value = withSpring(activeLayout.x, INDICATOR_SPRING);
    indicatorWidth.value = withSpring(activeLayout.width, INDICATOR_SPRING);
    indicatorOpacity.value = withSpring(1, INDICATOR_SPRING);
  }, [activeLayout, indicatorX, indicatorWidth, indicatorOpacity]);

  useEffect(() => {
    visibility.value = withSpring(visible ? 1 : 0, VISIBILITY_SPRING);
  }, [visible, visibility]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
    width: indicatorWidth.value,
    transform: [{ translateX: indicatorX.value }],
  }));

  const visibilityStyle = useAnimatedStyle(() => ({
    opacity: visibility.value,
    transform: [{ translateY: (1 - visibility.value) * VISIBILITY_DROP_DISTANCE }],
  }));

  return (
    <Animated.View
      testID="tab-bar"
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, BOTTOM_MARGIN) },
        visibilityStyle,
      ]}
    >
      <View
        style={[
          styles.capsule,
          { backgroundColor: theme.colors.background, borderColor: theme.colors.hairline },
        ]}
      >
        <View style={styles.innerRow}>
          <Animated.View
            testID="tab-bar-indicator"
            style={[
              styles.indicator,
              { backgroundColor: theme.colors.tabActiveBackground },
              indicatorStyle,
            ]}
          />
          {state.routes.map((route, index) => {
            const descriptor = descriptors[route.key];
            if (!descriptor) return null;
            const { options } = descriptor;
            // A screen declared with `<Tabs.Screen options={{ href: null }} />`
            // (Settings — reachable via the header's account icon, not a
            // tab) is unwound by Expo Router into `tabBarButton: () => null`
            // before this custom `tabBar` ever sees it, since that's the
            // hook the stock tab bar UI would consult. This bar owns its
            // own rendering instead of consulting `tabBarButton`, so it
            // reads that same marker to skip the route entirely rather
            // than rendering a tab for it.
            if (options.tabBarButton) return null;
            const isActive = state.index === index;
            const color = isActive ? theme.colors.chromeIcon : theme.colors.textInactive;

            return (
              <Pressable
                key={route.key}
                testID={options.tabBarButtonTestID}
                accessibilityRole="button"
                accessibilityLabel={typeof options.title === "string" ? options.title : route.name}
                accessibilityState={{ selected: isActive }}
                onLayout={(event: LayoutChangeEvent) => {
                  const { x, width } = event.nativeEvent.layout;
                  setTabLayouts((previous) => ({ ...previous, [route.key]: { x, width } }));
                }}
                onPress={() => {
                  onPress?.();
                  const event = navigation.emit({
                    type: "tabPress",
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!isActive && !event.defaultPrevented) navigation.navigate(route.name);
                }}
                style={styles.tab}
              >
                {options.tabBarIcon?.({
                  color,
                  size: TAB_ICON_SIZE,
                  focused: isActive,
                })}
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        testID="tab-bar-fab"
        accessibilityRole="button"
        accessibilityLabel="New plan"
        onPress={() => {
          onPress?.();
          router.push("/(plan-creation)/paste-sermon");
        }}
        style={[styles.fab, { backgroundColor: theme.colors.controlPrimary }]}
      >
        <Plus
          size={FAB_ICON_SIZE}
          color={theme.colors.onControlPrimary}
          strokeWidth={FAB_STROKE_WIDTH}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: SIDE_MARGIN,
    right: SIDE_MARGIN,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: GAP_TO_FAB,
  },
  capsule: {
    flex: 1,
    height: CAPSULE_HEIGHT,
    borderRadius: CAPSULE_RADIUS,
    borderWidth: 1,
  },
  innerRow: {
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
  tab: {
    flex: 1,
    height: TAB_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_RADIUS,
    alignItems: "center",
    justifyContent: "center",
  },
});
