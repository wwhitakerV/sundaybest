import { useState, type ReactNode } from "react";
import { StyleSheet, type LayoutChangeEvent } from "react-native";
import { useIsFocused } from "expo-router";
import Animated from "react-native-reanimated";
// Not re-exported from the top-level `expo-router` module, but this is the
// same internal path expo-router's own `TabsClient.d.ts` imports
// `BottomTabNavigationOptions` from — no `exports` map in expo-router's
// package.json restricts it, so it's a stable subpath, not a private one.
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";

import { useTheme } from "@/theme";
import { BottomFade } from "@/ui/atoms/BottomFade";
import { FloatingButton } from "@/ui/atoms/FloatingButton";
import { getFloatingNavBarBottom, getFloatingNavBarTintHeight } from "../floatingNavBar";
import { GatheredTab } from "./GatheredTab";
import { OpenTabs } from "./OpenTabs";
import { TabBarBannerSlot } from "./TabBarBannerSlot";
import { TabBarFab } from "./TabBarFab";
import {
  CAPSULE_BORDER_WIDTH,
  CAPSULE_HEIGHT,
  CAPSULE_INSET_IN_ROW,
  CAPSULE_RADIUS,
  FAB_SIZE,
  GAP_TO_FAB,
  RAISE_GEOMETRY,
  RAISE_LIFT,
  SIDE_MARGIN,
} from "./tab-bar-geometry";
import { useShownTabBarAccessory, type TabBarAccessory } from "./tab-bar-accessory";
import { useShownTabBarBanner } from "./tab-bar-banner";
import { useTabBarMinimize } from "./use-tab-bar-minimize";
import { useTabBarBannerReveal, useTabBarRaise } from "./use-tab-bar-raise";
import { useTabBarReveal } from "./use-tab-bar-reveal";

export type TabBarProps = BottomTabBarProps & {
  /** Called on every tab and FAB press, before navigation. */
  onPress?: () => void;
  /** The floating button beside the tabs: what it's called, and what it does. */
  fab: { label: string; onPress: () => void };
};

/**
 * The floating pill tab bar, plus a floating action button (FAB) beside it.
 * The app renders it through `Tabs`' `tabBar` prop — Expo Router's `Tabs`
 * takes a fully custom tab bar (`BottomTabBarProps`), which is what lets this
 * render as a floating capsule rather than the stock edge-to-edge bar.
 *
 * The FAB is not a fifth `Tabs.Screen`: what it's called and what it does
 * come from the caller (`fab`), so the bar knows no route of its own.
 *
 * The open tabs (`OpenTabs`) carry the active one's sliding pill; as it
 * slides, the newly active tab's icon coin-spins once and throws a small
 * burst of streaks upward (`AnimatedTabIcon`). The capsule itself carries
 * only its border, radius, and height.
 *
 * The whole bar reveals itself (`useTabBarReveal`) whenever the tabs are the
 * focused screen of the root stack — on first arriving, and each time a
 * modal or another screen pushed over the tabs is dismissed.
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
 * A banner can float above the tabs too (`useTabBarBanner`): it slides up
 * into the raised place at the bar's full width, and the FAB shrinks beside
 * the open tabs as it does for a raised button. A screen's raised button
 * takes that place first; the banner steps aside until it lowers again.
 *
 * `onPress` fires on every tab and FAB press, before navigation — this
 * component has no side-effect SDK access of its own (`ui` never imports
 * `core`), so haptic feedback is the caller's job.
 */
export function TabBar({ state, descriptors, navigation, insets, onPress, fab }: TabBarProps) {
  const theme = useTheme();
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
  // A banner floats above the tabs unless a screen's button is raised there.
  const banner = useShownTabBarBanner();
  const bannerShown = banner !== null && banner !== undefined && !raised;
  const [lastBanner, setLastBanner] = useState<ReactNode>(banner);
  if (banner != null && banner !== lastBanner) setLastBanner(banner);
  const bannerStyle = useTabBarBannerReveal(bannerShown, RAISE_LIFT);
  const { slotStyle, fabStyle, tintStyle } = useTabBarRaise(
    {
      buttonRaised: raised,
      fabShrunk: raised || (bannerShown && !minimized),
      tintRaised: raised || bannerShown,
    },
    RAISE_GEOMETRY,
  );

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
      {/* Beneath the tabs, so it slides up out from behind them and back. */}
      {lastBanner != null && (
        <TabBarBannerSlot banner={lastBanner} shown={bannerShown} style={bannerStyle} />
      )}

      <Animated.View
        testID="tab-bar-capsule"
        style={[
          styles.capsule,
          { backgroundColor: theme.colors.background, borderColor: theme.colors.hairline },
          capsuleStyle,
        ]}
      >
        <OpenTabs
          state={state}
          descriptors={descriptors}
          minimized={minimized}
          style={tabsStyle}
          onPressTab={pressTab}
        />

        <GatheredTab
          minimized={minimized}
          routeName={activeRoute?.name}
          options={activeOptions}
          style={gatheredStyle}
          onPress={() => {
            onPress?.();
            setRaisedFor(accessory);
          }}
        />
      </Animated.View>

      {lastAccessory && (
        <Animated.View
          pointerEvents={accessory ? "auto" : "none"}
          style={[styles.accessorySlot, slotStyle, buttonStyle]}
        >
          <FloatingButton
            testID={lastAccessory.testID}
            label={lastAccessory.label}
            {...(lastAccessory.icon && { icon: lastAccessory.icon })}
            onPress={lastAccessory.onPress}
          />
        </Animated.View>
      )}

      <TabBarFab
        label={fab.label}
        onPress={() => {
          onPress?.();
          fab.onPress();
        }}
        style={fabStyle}
      />
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
  // Beside the gathered circle or raised above the open tabs; placed by
  // `useTabBarRaise`. Always given a `top`: without one it's centred on the
  // whole bar, padding and all, and sits low.
  accessorySlot: {
    position: "absolute",
    height: CAPSULE_HEIGHT,
  },
});
