import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { usePresence } from "@/hooks/use-presence";
import { motion, radius, space, useTheme } from "@/theme";
import { SheetGrabber } from "@/ui/atoms/SheetGrabber";
import { SFProTitle } from "@/ui/typography/SFProTitle";

/** The sheet's share of the screen's height. */
const HEIGHT_RATIO = 0.5;

export type BottomSheetProps = {
  visible: boolean;
  /** A tap on the dimmed page above it, or the system's dismiss. */
  onClose: () => void;
  /** The sheet's title, shown at its top and announced as its heading. */
  accessibilityLabel: string;
  testID: string;
  children: ReactNode;
};

/**
 * A sheet over the bottom half of the screen, as iOS's own: it slides up
 * from the bottom edge as the page above it dims, and back down as it
 * closes. A tap on the dimmed page closes it. What's on the page beneath
 * stays live, so a change made in the sheet shows there at once.
 */
export function BottomSheet({
  visible,
  onClose,
  accessibilityLabel,
  testID,
  children,
}: BottomSheetProps) {
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const sheetHeight = height * HEIGHT_RATIO;
  const { mounted, progress } = usePresence(visible, motion.sheet);
  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.get()) * sheetHeight }],
  }));

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View
          style={[styles.scrim, { backgroundColor: theme.colors.mediaScrim }, scrimStyle]}
        >
          {/* VoiceOver skips it — the sheet beside it is modal — and closes the
          sheet with the escape gesture instead. */}
          <Pressable testID={`${testID}-scrim`} onPress={onClose} style={styles.scrim} />
        </Animated.View>
        <Animated.View
          testID={testID}
          accessibilityViewIsModal
          accessibilityLabel={accessibilityLabel}
          onAccessibilityEscape={onClose}
          style={[
            styles.sheet,
            { height: sheetHeight, backgroundColor: theme.colors.background },
            sheetStyle,
          ]}
        >
          <SheetGrabber testID={`${testID}-grabber`} />
          <SFProTitle accessibilityRole="header">{accessibilityLabel}</SFProTitle>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { ...StyleSheet.absoluteFill },
  sheet: {
    borderTopLeftRadius: radius[36],
    borderTopRightRadius: radius[36],
    paddingHorizontal: space[24],
    paddingTop: space[12],
    paddingBottom: space[40],
    gap: space[24],
  },
});
