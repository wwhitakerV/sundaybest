import { Pressable, StyleSheet } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { controlHeight, useTheme } from "@/theme";

const SIZE = controlHeight.headerButton;
const ICON_SIZE = 23;

export type RoundIconButtonProps = {
  icon: LucideIcon;
  accessibilityLabel: string;
  onPress: () => void;
  /** A toggle that's on (a liked verse): said so, its icon filled in `onColor`. */
  on?: boolean;
  /** The icon's colour, and its fill, while it's on. */
  onColor?: string;
  testID?: string;
};

/**
 * A round icon button on the page: the header buttons' shape — white, its icon
 * centred — with the page's edge (`containerBorder`, as it sits on the page,
 * not floating over it), for an action set among a page's content (a verse's
 * like and share). A toggle fills its icon while it's on.
 */
export function RoundIconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  on,
  onColor,
  testID,
}: RoundIconButtonProps) {
  const theme = useTheme();
  const tint = on && onColor ? onColor : theme.colors.chromeIcon;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      {...(on !== undefined && { accessibilityState: { selected: on } })}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: theme.colors.background, borderColor: theme.colors.containerBorder },
      ]}
    >
      <Icon
        size={ICON_SIZE}
        color={tint}
        fill={on && onColor ? onColor : "none"}
        strokeWidth={theme.icon.strokeWidth}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
