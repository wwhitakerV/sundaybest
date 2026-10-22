import { useState, type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { X } from "lucide-react-native";

import { usePresence } from "@/hooks/use-presence";
import { useSheetDrag } from "@/hooks/use-sheet-drag";
import { motion, radius, space, useTheme } from "@/theme";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { SheetGrabber } from "@/ui/atoms/SheetGrabber";
import { SerifTitle } from "@/ui/typography/SerifTitle";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import { useStatusBarOverlay } from "./status-bar/overlay";

/** The sheet's share of the screen's height, unless it asks for more. */
const HEIGHT_RATIO = 0.5;

export type BottomSheetProps = {
  visible: boolean;
  /** A tap on the dimmed page above it, or the system's dismiss. */
  onClose: () => void;
  /** The sheet's title, shown at its top and announced as its heading. */
  accessibilityLabel: string;
  testID: string;
  /** Its share of the screen's height: half by default; nearly all of it (0.95) for writing in. */
  heightRatio?: number;
  /** As tall as what's in it instead of a share of the screen (a list held to a few rows). */
  fit?: boolean;
  /** An X beside its title that leaves without keeping anything — for a sheet that writes. */
  onDiscard?: () => void;
  /** Something quiet at the far end of its title row: where you are in it ("3 of 6"). */
  titleAccessory?: ReactNode;
  /** Its title's voice: the app's own (the default), or editorial — the serif, a size smaller. */
  titleStyle?: "app" | "editorial";
  children: ReactNode;
};

/**
 * A sheet over the bottom of the screen — half of it, or as much as it asks
 * for — as iOS's own: it slides up
 * from the bottom edge as the page above it dims, and back down as it
 * closes. A tap on the dimmed page closes it, and so does dragging it down
 * by its top (`useSheetDrag`). What's on the page beneath
 * stays live, so a change made in the sheet shows there at once.
 */
export function BottomSheet({
  visible,
  onClose,
  accessibilityLabel,
  testID,
  heightRatio = HEIGHT_RATIO,
  fit = false,
  onDiscard,
  titleAccessory,
  titleStyle = "app",
  children,
}: BottomSheetProps) {
  const theme = useTheme();
  const statusBar = useStatusBarOverlay();
  const { height } = useWindowDimensions();
  // A sheet that fits its contents is measured once it's laid out; until then it waits below the screen.
  const [measured, setMeasured] = useState<number | null>(null);
  const sheetHeight = fit ? (measured ?? height) : height * heightRatio;
  const { mounted, progress } = usePresence(visible, motion.sheet);
  const { drag, gesture } = useSheetDrag(visible, sheetHeight, onClose);
  // Pulled down, the page behind it lightens as the sheet goes.
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: progress.get() * (1 - Math.min(1, Math.max(0, drag.get()) / sheetHeight)),
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.get()) * sheetHeight + drag.get() }],
  }));

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      {/* A modal is its own native root: its gestures need their own root too. */}
      <GestureHandlerRootView style={styles.root}>
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
          {...(fit && { onLayout: (event) => setMeasured(event.nativeEvent.layout.height) })}
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.background },
            !fit && { height: sheetHeight },
            sheetStyle,
          ]}
        >
          {/* Its top — the grabber, the title and round them — drags it down, as iOS's do. */}
          <GestureDetector gesture={gesture}>
            <View testID={`${testID}-handle`} style={styles.handle}>
              <SheetGrabber testID={`${testID}-grabber`} />
              <View style={styles.titleRow}>
                {titleStyle === "editorial" ? (
                  <SerifTitle variant="title" accessibilityRole="header" style={styles.title}>
                    {accessibilityLabel}
                  </SerifTitle>
                ) : (
                  <SFProTitle accessibilityRole="header" style={styles.title}>
                    {accessibilityLabel}
                  </SFProTitle>
                )}
                {titleAccessory}
                {onDiscard && (
                  <HeaderIconButton
                    testID={`${testID}-discard`}
                    icon={X}
                    accessibilityLabel="Close without saving"
                    onPress={onDiscard}
                  />
                )}
              </View>
            </View>
          </GestureDetector>
          {children}
        </Animated.View>
        {/* The app's status bar stays over the sheet and its scrim, as iOS's does. */}
        {statusBar}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  // The grabber and the title, the sheet's gap between them; reaching up over the sheet's top inset,
  // so a finger on the very top edge takes hold too.
  handle: { gap: space[24], marginTop: -space[14], paddingTop: space[14] },
  // Its title, and the X at its end when it has one.
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { flexShrink: 1 },
  scrim: { ...StyleSheet.absoluteFill },
  sheet: {
    borderTopLeftRadius: radius[36],
    borderTopRightRadius: radius[36],
    paddingHorizontal: space[24],
    // The grabber, this far below the sheet's top edge.
    paddingTop: space[14],
    paddingBottom: space[40],
    gap: space[24],
  },
});
