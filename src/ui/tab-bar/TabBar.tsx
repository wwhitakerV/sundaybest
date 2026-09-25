import { useState } from "react";
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import { useIsFocused, useRouter } from "expo-router";
import Animated from "react-native-reanimated";
// Not re-exported from the top-level `expo-router` module, but this is the
// same internal path expo-router's own `TabsClient.d.ts` imports
// `BottomTabNavigationOptions` from — no `exports` map in expo-router's
// package.json restricts it, so it's a stable subpath, not a private one.
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { Plus } from "lucide-react-native";

import { useTheme } from "@/theme";
import { BottomFade } from "../BottomFade";
import {
  FLOATING_NAV_BAR,
  getFloatingNavBarBottom,
  getFloatingNavBarTintHeight,
} from "../floatingNavBar";
import { AnimatedTabIcon } from "./AnimatedTabIcon";
import { useShownTabBarAccessory, type TabBarAccessory } from "./tab-bar-accessory";
import { useTabBarMinimize } from "./use-tab-bar-minimize";
import { useTabBarRaise, type TabBarRaiseGeometry } from "./use-tab-bar-raise";
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
} = FLOATING_NAV_BAR;
const GAP_TO_FAB = 10;
const TAB_HEIGHT = CAPSULE_HEIGHT - CAPSULE_V_PADDING * 2;
const TAB_PILL_RADIUS = CAPSULE_RADIUS - CAPSULE_H_PADDING;
const TAB_ICON_SIZE = 23;
const CAPSULE_BORDER_WIDTH = 1;
/** Heavier than the capsule's hairline, so the screen's button carries more weight. */
const ACCESSORY_BORDER_WIDTH = 1;
// The icon sits centred in its tab, so this is how far its top edge is
// below the capsule's outer top edge — what the burst must climb to clear.
const ICON_TOP_TO_BAR_TOP =
  CAPSULE_BORDER_WIDTH + CAPSULE_V_PADDING + (TAB_HEIGHT - TAB_ICON_SIZE) / 2;
const FAB_SIZE = 66;
const FAB_RADIUS = 33;
const FAB_ICON_SIZE = 26;
const FAB_STROKE_WIDTH = 2.5;
/** The capsule's centred on the FAB, so it sits this far inside the row's top and bottom. */
const CAPSULE_INSET_IN_ROW = (FAB_SIZE - CAPSULE_HEIGHT) / 2;
/**
 * How much higher the screen's button sits raised above the open tabs than
 * beside the gathered ones — a capsule and a gap. The bar keeps this much
 * room above its row, always, so the raised button's inside its frame and
 * takes taps; the room itself passes touches through.
 */
const RAISE_LIFT = CAPSULE_HEIGHT + GAP_TO_FAB;
const RAISE_GEOMETRY: TabBarRaiseGeometry = {
  beside: {
    top: RAISE_LIFT + CAPSULE_INSET_IN_ROW,
    left: CAPSULE_HEIGHT + GAP_TO_FAB,
    right: FAB_SIZE + GAP_TO_FAB,
  },
  raised: { top: CAPSULE_INSET_IN_ROW, left: 0, right: 0 },
  fabScale: CAPSULE_HEIGHT / FAB_SIZE,
  lift: RAISE_LIFT,
};

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
 * A screen can ask it to minimise beside a button of its own
 * (`useTabBarAccessory`): the tabs gather into a circle holding just the
 * active one, the button springs in to fill the space beside it, and the
 * FAB stays where it is. When the screen stops asking, it springs back open.
 * Tapping the gathered tabs opens them out while the screen's still asking:
 * the button rises above them to the bar's full width and the FAB shrinks to
 * the capsule's height (`useTabBarRaise`) — until the screen asks afresh.
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

  // Minimised beside a screen's button — or, once the gathered tabs are
  // tapped, open again with the button raised above them, until the screen
  // stops asking (and asks afresh). The last one asked for stays drawn while
  // it springs away, so it never empties mid-animation.
  const accessory = useShownTabBarAccessory();
  const [raisedFor, setRaisedFor] = useState<TabBarAccessory | null>(null);
  const raised = accessory !== null && raisedFor === accessory;
  const minimized = accessory !== null && !raised;
  const [lastAccessory, setLastAccessory] = useState<TabBarAccessory | null>(accessory);
  if (accessory && accessory !== lastAccessory) setLastAccessory(accessory);
  const [rowWidth, setRowWidth] = useState(0);
  const { capsuleStyle, tabsStyle, gatheredStyle, buttonStyle } = useTabBarMinimize(
    minimized,
    accessory !== null,
    rowWidth > 0 ? rowWidth - FAB_SIZE - GAP_TO_FAB : 0,
    CAPSULE_HEIGHT,
  );
  const { slotStyle, fabStyle, tintStyle } = useTabBarRaise(raised, RAISE_GEOMETRY);

  const capsuleBottom = getFloatingNavBarBottom(insets.bottom);
  // Tall enough for the raised button; held down by the lift until it rises.
  const tintHeight = getFloatingNavBarTintHeight(capsuleBottom) + RAISE_LIFT;
  const activeRoute = state.routes[state.index];
  const activeOptions = activeRoute ? descriptors[activeRoute.key]?.options : undefined;
  function pressTab(routeKey: string, routeName: string, isActive: boolean) {
    onPress?.();
    const event = navigation.emit({ type: "tabPress", target: routeKey, canPreventDefault: true });
    if (!isActive && !event.defaultPrevented) navigation.navigate(routeName);
  }

  return (
    <Animated.View
      testID="tab-bar"
      onLayout={(event: LayoutChangeEvent) => setRowWidth(event.nativeEvent.layout.width)}
      style={[
        styles.wrapper,
        {
          // The capsule's bottom where every floating bar's goes; the FAB's a little lower.
          paddingBottom: capsuleBottom - CAPSULE_INSET_IN_ROW,
          pointerEvents: isFocused ? "box-none" : "none",
        },
        revealStyle,
      ]}
    >
      {/* Behind it all, edge to edge: hides what scrolls under the bar —
      solid below the capsule, fading out a little above it (or above the
      raised button). */}
      <Animated.View pointerEvents="none" style={[styles.tint, { height: tintHeight }, tintStyle]}>
        <BottomFade
          testID="tab-bar-tint"
          height={tintHeight}
          solidHeight={capsuleBottom + RAISE_LIFT}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.capsule,
          { backgroundColor: theme.colors.background, borderColor: theme.colors.hairline },
          capsuleStyle,
        ]}
      >
        <Animated.View
          pointerEvents={minimized ? "none" : "auto"}
          style={[styles.innerRow, tabsStyle]}
        >
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
                onPress={() => pressTab(route.key, route.name, isActive)}
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
        </Animated.View>

        {/* Gathered: just the active tab, centred in the circle the capsule becomes. */}
        <Animated.View
          pointerEvents={minimized ? "auto" : "none"}
          style={[StyleSheet.absoluteFill, gatheredStyle]}
        >
          <Pressable
            testID="tab-bar-collapsed"
            accessibilityRole="button"
            accessibilityLabel={
              typeof activeOptions?.title === "string" ? activeOptions.title : activeRoute?.name
            }
            accessibilityHint="Shows the tabs"
            accessibilityState={{ selected: true }}
            pointerEvents={minimized ? "auto" : "none"}
            onPress={() => {
              onPress?.();
              setRaisedFor(accessory);
            }}
            style={styles.gathered}
          >
            {/* The active tab's highlight, as a circle — the same height, and
            inset as far from the capsule's edge, as the pill it is when open. */}
            <View
              testID="tab-bar-collapsed-indicator"
              style={[
                styles.gatheredIndicator,
                { backgroundColor: theme.colors.tabActiveBackground },
              ]}
            />
            {activeOptions?.tabBarIcon?.({
              color: theme.colors.chromeIcon,
              size: TAB_ICON_SIZE,
              focused: true,
            })}
          </Pressable>
        </Animated.View>
      </Animated.View>

      {lastAccessory && (
        <Animated.View
          pointerEvents={accessory ? "auto" : "none"}
          style={[styles.accessorySlot, slotStyle, buttonStyle]}
        >
          <Pressable
            testID={lastAccessory.testID}
            accessibilityRole="button"
            accessibilityLabel={lastAccessory.label}
            onPress={lastAccessory.onPress}
            style={[
              styles.accessory,
              // A heavier edge than the capsule's: the screen's own call to action, not another tab.
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.borderStrong,
              },
            ]}
          >
            {lastAccessory.icon && (
              <lastAccessory.icon
                size={20}
                color={theme.colors.chromeIcon}
                strokeWidth={theme.icon.strokeWidth}
              />
            )}
            <Text numberOfLines={1} style={[theme.typography.button, { color: theme.colors.text }]}>
              {lastAccessory.label}
            </Text>
          </Pressable>
        </Animated.View>
      )}

      <Animated.View style={[styles.fabSlot, fabStyle]}>
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
    paddingTop: RAISE_LIFT,
  },
  tint: { position: "absolute", left: -SIDE_MARGIN, right: -SIDE_MARGIN, bottom: 0 },
  // Leaves the FAB its room, and is centred on it by its margins — so the row
  // is the FAB's height without the FAB being in it.
  capsule: {
    flex: 1,
    marginRight: FAB_SIZE + GAP_TO_FAB,
    marginVertical: CAPSULE_INSET_IN_ROW,
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
  gathered: { flex: 1, alignItems: "center", justifyContent: "center" },
  gatheredIndicator: {
    position: "absolute",
    width: TAB_HEIGHT,
    height: TAB_HEIGHT,
    borderRadius: TAB_HEIGHT / 2,
  },
  // Beside the gathered circle or raised above the open tabs; placed by
  // `useTabBarRaise`. Always given a `top`: without one it's centred on the
  // whole bar, padding and all, and sits low.
  accessorySlot: {
    position: "absolute",
    height: CAPSULE_HEIGHT,
  },
  accessory: {
    flex: 1,
    borderRadius: CAPSULE_RADIUS,
    borderWidth: ACCESSORY_BORDER_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  // Pinned, out of the row's flow, so nothing the capsule does moves it —
  // only its own shrink beside the raised button.
  fabSlot: { position: "absolute", top: RAISE_LIFT, right: 0 },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_RADIUS,
    alignItems: "center",
    justifyContent: "center",
  },
});
