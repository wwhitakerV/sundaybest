import { Pressable, StyleSheet, Text } from "react-native";
import { ChevronRight, type LucideIcon } from "lucide-react-native";

import { useTheme } from "@/theme";
import { IconBadge } from "./IconBadge";

const CHEVRON = 20;
const MIN_HEIGHT = 64;

export type LinkRowProps = {
  icon: LucideIcon;
  label: string;
  /** Where it goes, for VoiceOver: "Opens Luke 24:25-49 in Safari". */
  accessibilityHint: string;
  onPress: () => void;
  testID: string;
};

/** A row that leads somewhere: its icon in a badge, its label, and a chevron. */
export function LinkRow({ icon, label, accessibilityHint, onPress, testID }: LinkRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={[styles.row, { gap: theme.spacing.md, paddingVertical: theme.spacing.md }]}
    >
      <IconBadge icon={icon} />
      <Text style={[theme.typography.listItem, styles.label, { color: theme.colors.text }]}>
        {label}
      </Text>
      <ChevronRight
        size={CHEVRON}
        color={theme.colors.textMuted}
        strokeWidth={theme.icon.strokeWidth}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: MIN_HEIGHT, flexDirection: "row", alignItems: "center" },
  label: { flex: 1 },
});
