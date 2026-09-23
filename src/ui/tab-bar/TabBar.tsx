import { useState } from "react";
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { useIsFocused, useRouter } from "expo-router";
import Animated from "react-native-reanimated";
// Not re-exported from the top-level `expo-router` module, but this is the
// same internal path expo-router's own `TabsClient.d.ts` imports
// `BottomTabNavigationOptions` from — no `exports` map in expo-router's
// package.json restricts it, so it's a stable subpath, not a private one.
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { Plus } from "lucide-react-native";

import { useTheme } from "@/theme";
import { FLOATING_NAV_BAR } from "../floatingNavBar";
import { AnimatedTabIcon } from "./AnimatedTabIcon";
import { useTabBarReveal } from "./use-tab-bar-reveal";
import { useTabIndicator, type TabLayout } from "./use-tab-indicator";

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
const CAPSULE_BORDER_WIDTH = 1;
// The icon sits centred in its tab, so this is how far its top edge is
// below the capsule's outer top edge — what the burst must climb to clear.
const ICON_TOP_TO_BAR_TOP =
  CAPSULE_BORDER_WIDTH + CAPSULE_V_PADDING + (TAB_HEIGHT - TAB_ICON_SIZE) / 2;
const FAB_SIZE = 66;
const FAB_RADIUS = 33;
const FAB_ICON_SIZE = 26;
const FAB_STROKE_WIDTH = 2.5;

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
 * The pill's motion lives in `useTabIndicator`. As it slides, the newly
 * active tab's icon coin-spins once and throws a small burst of streaks
 * upward (`AnimatedTabIcon`).
 *
 * The whole bar reveals itself (`useTabBarReveal`) whenever the tabs are the
 * focused screen of the root stack — on arriving from Welcome, and each time
 * a modal (Daily Study, New Plan) or another non-tab screen is dismissed.
 * While something covers the tabs it sits back in its hidden position and
 * ignores touches, ready to animate up again.
 *
 * `onPress` fires on every tab and FAB press, before navigation — this
 * component has no side-effect SDK access of its own (`ui` never imports
 * `core`), so haptic feedback is the caller's job; `(tabs)/_layout.tsx`
 * passes `tapFeedback` from `@/core/haptics`.
 */
export function TabBar({ state, descriptors, navigation, insets, onPress }: TabBarProps) {
  const theme = useTheme();
  const router = useRouter();
  const [tabLayouts, setTabLayouts] = useState<Record<string, TabLayout>>({});

  const activeLayout = tabLayouts[state.routes[state.index]?.key ?? ""];
  const indicatorStyle = useTabIndicator(activeLayout);

  // Rendered by the tab navigator itself, outside any tab's screen, so this is
  // whether the whole `(tabs)` route is focused in the root stack.
  const isFocused = useIsFocused();
  const revealStyle = useTabBarReveal(isFocused);

  return (
    <Animated.View
      testID="tab-bar"
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, BOTTOM_MARGIN),
          pointerEvents: isFocused ? "auto" : "none",
        },
        revealStyle,
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
                <AnimatedTabIcon
                  active={isActive}
                  iconSize={TAB_ICON_SIZE}
                  burstClearance={ICON_TOP_TO_BAR_TOP}
                >
                  {options.tabBarIcon?.({
                    color,
                    size: TAB_ICON_SIZE,
                    focused: isActive,
                  })}
                </AnimatedTabIcon>
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
    borderWidth: CAPSULE_BORDER_WIDTH,
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
