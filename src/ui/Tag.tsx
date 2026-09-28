import { StyleSheet, Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { useTheme } from "@/theme";

const ICON_SIZE = 13;

export type TagProps = {
  label: string;
  icon?: LucideIcon;
  /** The label's colour. */
  color: string;
  /** The icon's, when it differs from the label's (a red flame on dark words). */
  iconColor?: string;
  /** The pill's fill: a soft tint of `color`, or a veil over a colour of the content's own. */
  background: string;
  testID?: string;
};

/**
 * A small pill naming a kind or a count — "Quiz", "60 sec", "12 day streak" —
 * with an optional icon. Not a control: it doesn't take a press.
 */
export function Tag({ label, icon: Icon, color, iconColor, background, testID }: TagProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.tag,
        {
          backgroundColor: background,
          borderRadius: theme.radii.pill,
          gap: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
        },
      ]}
    >
      {Icon && (
        <Icon size={ICON_SIZE} color={iconColor ?? color} strokeWidth={theme.icon.strokeWidth} />
      )}
      <Text style={[theme.typography.tag, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
});
