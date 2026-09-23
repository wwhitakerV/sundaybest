import { Pressable, StyleSheet } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { useTheme } from "@/theme";

const SIZE = 49;
const RADIUS = 25;
const DEFAULT_ICON_SIZE = 23;
const STROKE_WIDTH = 1.75;

export type HeaderIconButtonProps = {
  icon: LucideIcon;
  accessibilityLabel: string;
  onPress: () => void;
  /** Overrides the default 23pt icon size — used by the smaller `Type` icon. */
  size?: number;
  /** Draws the hairline border. Defaults to true; the top-level screens'
   * right-side icons (account, search) turn it off. */
  bordered?: boolean;
  testID?: string;
};

/**
 * The circular icon button every header uses: back, close, more, text
 * controls, search, notifications. White fill, centered icon — one place
 * for that chrome so every header stays visually consistent. Bordered by
 * default; borderless for the top-level screens' right-side icons.
 */
export function HeaderIconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  size = DEFAULT_ICON_SIZE,
  bordered = true,
  testID,
}: HeaderIconButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: theme.colors.background,
          borderColor: bordered ? theme.colors.hairline : "transparent",
        },
      ]}
    >
      <Icon size={size} color={theme.colors.chromeIcon} strokeWidth={STROKE_WIDTH} />
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
