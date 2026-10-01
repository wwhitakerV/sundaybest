import { StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { radius, useTheme } from "@/theme";

const SIZE = 40;
const ICON_SIZE = 18;

export type IconBadgeProps = {
  icon: LucideIcon;
  /** Whether what it marks is picked: the badge takes the selection's colours. */
  selected?: boolean;
  testID?: string;
};

/**
 * An icon in a soft round badge, leading a row or a card: grey and ink as a
 * rule, the selection's blush and the accent when what it marks is picked.
 */
export function IconBadge({ icon: Icon, selected = false, testID }: IconBadgeProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.badge,
        {
          backgroundColor: selected ? theme.colors.selectionBadge : theme.colors.surface,
          borderRadius: radius.pill,
        },
      ]}
    >
      <Icon
        size={ICON_SIZE}
        color={selected ? theme.colors.accent : theme.colors.text}
        strokeWidth={theme.icon.strokeWidth}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" },
});
