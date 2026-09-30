import { Pressable, StyleSheet } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { useTheme } from "@/theme";

const SIZE = 44;
const ICON_SIZE = 20;
const RADIUS = 14;

export type IconSquareButtonProps = {
  icon: LucideIcon;
  /** What it does, for VoiceOver: "All subjects". */
  accessibilityLabel: string;
  onPress: () => void;
  testID: string;
};

/** An icon-only control as a 44 pt rounded square, outlined on the page. */
export function IconSquareButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  testID,
}: IconSquareButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
      ]}
    >
      <Icon size={ICON_SIZE} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: RADIUS,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
