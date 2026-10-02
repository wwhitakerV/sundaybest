import { Modal, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { Flame } from "lucide-react-native";

import { usePresence } from "@/hooks/use-presence";
import { Button } from "@/ui/atoms/Button";
import { SheetGrabber } from "@/ui/atoms/SheetGrabber";
import { motion, radius, space, useTheme } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

export type CaptionsSheetProps = {
  visible: boolean;
  onTryAnotherLink: () => void;
  onRemindLater: () => void;
  testID: string;
};

/**
 * "This video doesn't have captions yet": a sheet over New Plan, with the
 * link and its sermon still showing, dimmed, behind it. It slides up from the
 * bottom edge as the page dims, as iOS's sheets do, and back down as it goes.
 */
export function CaptionsSheet({
  visible,
  onTryAnotherLink,
  onRemindLater,
  testID,
}: CaptionsSheetProps) {
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const { mounted, progress } = usePresence(visible, motion.sheet);
  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));
  // From just below the screen: the sheet is never taller than it.
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.get()) * height }],
  }));

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onTryAnotherLink}>
      <View testID={testID} style={styles.root} accessibilityViewIsModal>
        <Animated.View
          style={[styles.scrim, { backgroundColor: theme.colors.mediaScrim }, scrimStyle]}
        />
        <Animated.View
          style={[styles.sheet, { backgroundColor: theme.colors.background }, sheetStyle]}
        >
          <SheetGrabber testID={`${testID}-grabber`} />
          <View style={[styles.icon, { backgroundColor: theme.colors.segmentBackground }]}>
            <Flame size={28} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
          </View>
          <SFProTitle accessibilityRole="header">
            This video doesn&apos;t have captions yet
          </SFProTitle>
          <SFProBody variant="bodyLoose" tone="textMuted">
            SundayBest reads captions to build your plan. New uploads often get them within a few
            hours, so try again later or use another link.
          </SFProBody>
          <View style={styles.actions}>
            <Button
              testID={`${testID}-try-another-link-button`}
              label="Try another link"
              onPress={onTryAnotherLink}
            />
            <Button
              testID={`${testID}-remind-later-button`}
              label="Remind me in 3 hours"
              variant="secondary"
              onPress={onRemindLater}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** The round badge over the sheet's title. */
const ICON_SIZE = 64;

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { ...StyleSheet.absoluteFill },
  sheet: {
    borderTopLeftRadius: radius[36],
    borderTopRightRadius: radius[36],
    paddingHorizontal: space[24],
    paddingTop: space[12],
    paddingBottom: space[40],
    gap: space[16],
  },
  icon: {
    marginTop: space[12],
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { gap: space[12], marginTop: space[12] },
});
