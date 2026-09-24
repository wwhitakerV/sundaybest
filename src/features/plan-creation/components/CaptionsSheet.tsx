import { Modal, StyleSheet, Text, View } from "react-native";
import { Flame } from "lucide-react-native";

import { Button } from "@/ui/Button";
import { useTheme } from "@/theme";

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
          <Text
            accessibilityRole="header"
            style={[theme.typography.screenTitle, { color: theme.colors.text }]}
          >
            This video doesn&apos;t have captions yet
          </Text>
          <Text style={[theme.typography.body, styles.body, { color: theme.colors.textMuted }]}>
            SundayBest reads captions to build your plan. New uploads often get them within a few
            hours, so try again later or use another link.
          </Text>
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

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },
  grabber: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, marginBottom: 12 },
  icon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  body: { lineHeight: 26 },
  actions: { gap: 12, marginTop: 12 },
});
