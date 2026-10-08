import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { usePresence } from "@/hooks/use-presence";
import { radius, useTheme } from "@/theme";

/** It grows from this to full size, out of the corner it hangs from. */
const START_SCALE = 0.85;

export type PopoverAnchor = { top: number; right: number };

export type PopoverProps = {
  visible: boolean;
  onClose: () => void;
  /** Where its top-right corner sits, in points from the screen's top and right edges. */
  anchor: PopoverAnchor;
  /**
   * How wide it is. Without one it hugs what it holds — for a native control
   * that sizes itself (iOS's time wheel), which a set width would clip.
   */
  width?: number;
  accessibilityLabel: string;
  /** A menu of choices says so; anything else is a plain group. */
  accessibilityRole?: "menu";
  testID: string;
  children: ReactNode;
};

/**
 * The one floating container the app opens from a control — Plan Detail's
 * More menu, Daily reminder's time: a card that grows out of its top-right
 * corner and fades in, settling without a bounce, and fades back as it
 * closes. The page under it stays clear; a tap anywhere off it closes it.
 */
export function Popover({
  visible,
  onClose,
  anchor,
  width,
  accessibilityLabel,
  accessibilityRole,
  testID,
  children,
}: PopoverProps) {
  const theme = useTheme();
  const { mounted, progress } = usePresence(visible);
  const popoverStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scale: START_SCALE + (1 - START_SCALE) * progress.get() }],
  }));

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      {/* Clear, as iOS leaves the page under a popover; VoiceOver uses the escape gesture. */}
      <Pressable testID={`${testID}-scrim`} onPress={onClose} style={StyleSheet.absoluteFill} />
      <Animated.View
        testID={testID}
        {...(accessibilityRole && { accessibilityRole })}
        accessibilityViewIsModal
        accessibilityLabel={accessibilityLabel}
        onAccessibilityEscape={onClose}
        style={[
          styles.popover,
          {
            ...(width !== undefined && { width }),
            top: anchor.top,
            right: anchor.right,
            shadowColor: theme.colors.shadow,
            ...theme.elevation.menu,
          },
          popoverStyle,
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
          {children}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  popover: { position: "absolute", transformOrigin: "top right" },
  card: { borderWidth: 1, overflow: "hidden" },
});
