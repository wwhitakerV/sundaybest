import { Pressable, StyleSheet, Text } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { useTheme } from "@/theme";

const HEIGHT = 44;

export type CompactButtonProps = {
  label: string;
  /** An icon before the label, e.g. `Play`. */
  icon?: LucideIcon;
  /** Just the icon, in a circle — still named by `label` for a screen reader. */
  iconOnly?: boolean;
  /**
   * The ink of the colour it sits on: `light` for a dark colour (a white
   * button, dark words), `dark` for a light one (a black button, white words).
   */
  tone: "light" | "dark";
  onPress: () => void;
  testID?: string;
};

/**
 * A smaller call to action, set on a colour of the content's own — white on
 * a dark colour, black on a light one — so it stands out without taking the
 * full width. The app's full-width actions are `Button`.
 */
export function CompactButton({
  label,
  icon: Icon,
  iconOnly = false,
  tone,
  onPress,
  testID,
}: CompactButtonProps) {
  const theme = useTheme();
  const fill = tone === "light" ? theme.colors.inkOnDark : theme.colors.inkOnLight;
  const ink = tone === "light" ? theme.colors.inkOnLight : theme.colors.inkOnDark;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.button,
        iconOnly && styles.round,
        { backgroundColor: fill, borderRadius: theme.radii.pill },
      ]}
    >
      {Icon && (
        <Icon
          size={iconOnly ? 20 : 16}
          color={ink}
          // {...(!iconOnly && { fill: ink })}
          strokeWidth={theme.icon.strokeWidth}
        />
      )}
      {!iconOnly && <Text style={[theme.typography.compactButton, { color: ink }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: HEIGHT,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "center",
  },
  round: { width: HEIGHT, paddingHorizontal: 0 },
});
