import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import { Plus } from "lucide-react-native";

import { useTheme } from "@/theme";
import { FAB_SIZE, RAISE_LIFT } from "./tab-bar-geometry";

const FAB_RADIUS = 33;
const FAB_ICON_SIZE = 26;
const FAB_STROKE_WIDTH = 2.5;

export type TabBarFabProps = {
  label: string;
  onPress: () => void;
  /** It shrinks to the capsule's height while something's raised above the open tabs (`useTabBarRaise`). */
  style: StyleProp<AnimatedStyle<ViewStyle>>;
};

/** The round + beside the tabs: the bar's floating action button. */
export function TabBarFab({ label, onPress, style }: TabBarFabProps) {
  const theme = useTheme();

  return (
    <Animated.View testID="tab-bar-fab-slot" style={[styles.slot, style]}>
      <Pressable
        testID="tab-bar-fab"
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
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
  // Pinned, out of the row's flow, so nothing the capsule does moves it —
  // only its own shrink beside the raised button.
  slot: { position: "absolute", top: RAISE_LIFT, right: 0 },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_RADIUS,
    alignItems: "center",
    justifyContent: "center",
  },
});
