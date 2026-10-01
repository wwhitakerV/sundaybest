import { Modal, StyleSheet, View } from "react-native";
import { Flame } from "lucide-react-native";

import { Button } from "@/ui/atoms/Button";
import { radius, space, useTheme } from "@/theme";
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
 * link and its sermon still showing, dimmed, behind it.
 */
export function CaptionsSheet({
  visible,
  onTryAnotherLink,
  onRemindLater,
  testID,
}: CaptionsSheetProps) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onTryAnotherLink}>
      <View
        testID={testID}
        style={[styles.scrim, { backgroundColor: theme.colors.mediaScrim }]}
        accessibilityViewIsModal
      >
        <View style={[styles.sheet, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.grabber, { backgroundColor: theme.colors.divider }]} />
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
        </View>
      </View>
    </Modal>
  );
}

/** iOS's own sheet grabber, drawn to match it. */
const GRABBER = { width: 40, height: 5, radius: 3 } as const;
/** The round badge over the sheet's title. */
const ICON_SIZE = 64;

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radius[36],
    borderTopRightRadius: radius[36],
    paddingHorizontal: space[24],
    paddingTop: space[12],
    paddingBottom: space[40],
    gap: space[16],
  },
  grabber: {
    alignSelf: "center",
    width: GRABBER.width,
    height: GRABBER.height,
    borderRadius: GRABBER.radius,
    marginBottom: space[12],
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { gap: space[12], marginTop: space[12] },
});
