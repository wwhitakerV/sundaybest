import { Pressable, StyleSheet } from "react-native";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";

import { useTheme } from "@/theme";
import { AnimatedTabIcon } from "./AnimatedTabIcon";
import {
  CAPSULE_BORDER_WIDTH,
  CAPSULE_V_PADDING,
  TAB_HEIGHT,
  TAB_ICON_SIZE,
} from "./tab-bar-geometry";
import type { TabLayout } from "./use-tab-indicator";

// The icon sits centred in its tab, so this is how far its top edge is
// below the capsule's outer top edge — what the burst must climb to clear.
const ICON_TOP_TO_BAR_TOP =
  CAPSULE_BORDER_WIDTH + CAPSULE_V_PADDING + (TAB_HEIGHT - TAB_ICON_SIZE) / 2;

export type TabButtonProps = {
  routeName: string;
  options: BottomTabBarProps["descriptors"][string]["options"];
  active: boolean;
  /** Reports where the tab sits in the row, for the active pill to slide to. */
  onLayout: (layout: TabLayout) => void;
  onPress: () => void;
};

/**
 * One tab of the open bar: its icon, in the active ink or the inactive one,
 * flexing to share the row evenly. The active one's icon coin-spins and
 * bursts as it's picked (`AnimatedTabIcon`).
 */
export function TabButton({ routeName, options, active, onLayout, onPress }: TabButtonProps) {
  const theme = useTheme();
  const color = active ? theme.colors.chromeIcon : theme.colors.textInactive;

  return (
    <Pressable
      testID={options.tabBarButtonTestID}
      accessibilityRole="button"
      accessibilityLabel={typeof options.title === "string" ? options.title : routeName}
      accessibilityState={{ selected: active }}
      onLayout={(event) => {
        const { x, width } = event.nativeEvent.layout;
        onLayout({ x, width });
      }}
      onPress={onPress}
      style={styles.tab}
    >
      <AnimatedTabIcon
        active={active}
        iconSize={TAB_ICON_SIZE}
        burstClearance={ICON_TOP_TO_BAR_TOP}
      >
        {options.tabBarIcon?.({ color, size: TAB_ICON_SIZE, focused: active })}
      </AnimatedTabIcon>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    height: TAB_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
});
