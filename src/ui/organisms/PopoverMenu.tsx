import { Fragment } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import type { LucideIcon } from "lucide-react-native";

import { usePresence } from "@/hooks/use-presence";
import { radius, space, useTheme } from "@/theme";
import { Divider } from "@/ui/atoms/Divider";
import { SFProBody } from "@/ui/typography/SFProBody";

/** As wide as iOS's own menus. */
const WIDTH = 250;
const ROW_HEIGHT = 48;
const ICON_SIZE = 20;
/** It grows from this to full size, out of the corner it hangs from. */
const START_SCALE = 0.85;

type PopoverMenuItem = {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  testID: string;
};

export type PopoverMenuProps = {
  visible: boolean;
  onClose: () => void;
  items: readonly PopoverMenuItem[];
  /** Where its top-right corner sits, in points from the screen's top and right edges. */
  anchor: { top: number; right: number };
  accessibilityLabel: string;
  testID: string;
};

/**
 * A menu that opens from the button that asked for it, as iOS's do: it grows
 * out of its top-right corner and fades in, settling without a bounce, and
 * fades back as it closes. Each item is its label with its icon at the end.
 * Picking one closes the menu, then does it; a tap anywhere else just closes.
 */
export function PopoverMenu({
  visible,
  onClose,
  items,
  anchor,
  accessibilityLabel,
  testID,
}: PopoverMenuProps) {
  const theme = useTheme();
  const { mounted, progress } = usePresence(visible);
  const menuStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scale: START_SCALE + (1 - START_SCALE) * progress.get() }],
  }));

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      {/* Clear, as iOS leaves the page under a menu; VoiceOver uses the escape gesture. */}
      <Pressable testID={`${testID}-scrim`} onPress={onClose} style={StyleSheet.absoluteFill} />
      <Animated.View
        testID={testID}
        accessibilityRole="menu"
        accessibilityViewIsModal
        accessibilityLabel={accessibilityLabel}
        onAccessibilityEscape={onClose}
        style={[
          styles.menu,
          {
            top: anchor.top,
            right: anchor.right,
            shadowColor: theme.colors.shadow,
            ...theme.elevation.menu,
          },
          menuStyle,
        ]}
      >
        {/* Clipped inside, so the shadow outside it still shows. */}
        <View
          style={[
            styles.card,
            {
              borderRadius: radius[16],
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.containerBorder,
            },
          ]}
        >
          {items.map((item, index) => (
            <Fragment key={item.testID}>
              {index > 0 && <Divider />}
              <MenuRow
                item={item}
                onPress={() => {
                  onClose();
                  item.onPress();
                }}
              />
            </Fragment>
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
}

function MenuRow({ item, onPress }: { item: PopoverMenuItem; onPress: () => void }) {
  const theme = useTheme();
  const Icon = item.icon;

  return (
    <Pressable
      testID={item.testID}
      accessibilityRole="menuitem"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { gap: space[12], paddingHorizontal: space[16] },
        pressed && { backgroundColor: theme.colors.segmentBackground },
      ]}
    >
      <SFProBody style={styles.label} numberOfLines={1}>
        {item.label}
      </SFProBody>
      <Icon size={ICON_SIZE} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menu: { position: "absolute", width: WIDTH, transformOrigin: "top right" },
  card: { borderWidth: 1, overflow: "hidden" },
  row: { minHeight: ROW_HEIGHT, flexDirection: "row", alignItems: "center" },
  label: { flex: 1 },
});
