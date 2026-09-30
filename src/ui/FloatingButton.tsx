import { Pressable, StyleSheet, Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { useTheme } from "@/theme";
import { FLOATING_NAV_BAR } from "./floatingNavBar";

const ICON_SIZE = 20;
const BORDER_WIDTH = 1;

export type FloatingButtonProps = {
  label: string;
  /** An icon before the label. */
  icon?: LucideIcon;
  /** A screen's primary action: filled black, as the primary control is. */
  primary?: boolean;
  /** A lower-emphasis action beside the main one: edged as lightly as the bar itself. */
  quiet?: boolean;
  /** Nowhere to go: it can't be pressed, and steps back. */
  disabled?: boolean;
  onPress: () => void;
  testID: string;
};

/**
 * A screen's own call to action where the floating bars are: a capsule as
 * tall as they are, its label in the button face. White and edged more
 * heavily than a bar, so it reads as the screen's, not another tab — or
 * `quiet`, edged as lightly; `primary`, the screen's main action, it fills
 * black. Plan Detail's Continue, beside the gathered
 * tab bar, and an exam's Begin are the same button. Fills the width it's
 * given.
 */
export function FloatingButton({
  label,
  icon: Icon,
  primary = false,
  quiet = false,
  disabled = false,
  onPress,
  testID,
}: FloatingButtonProps) {
  const theme = useTheme();
  const edge = quiet ? theme.colors.hairline : theme.colors.borderStrong;
  const ink = primary ? theme.colors.onControlPrimary : theme.colors.text;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: primary ? theme.colors.controlPrimary : theme.colors.background,
          borderColor: primary ? theme.colors.controlPrimary : edge,
          gap: theme.spacing.sm,
        },
        disabled && styles.disabled,
      ]}
    >
      {Icon && (
        <View testID={`${testID}-icon`}>
          <Icon
            size={ICON_SIZE}
            color={primary ? ink : theme.colors.chromeIcon}
            strokeWidth={theme.icon.strokeWidth}
          />
        </View>
      )}
      <Text numberOfLines={1} style={[theme.typography.button, { color: ink }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** How a button with nowhere to go steps back. */
const DISABLED_OPACITY = 0.4;

const styles = StyleSheet.create({
  disabled: { opacity: DISABLED_OPACITY },
  button: {
    flex: 1,
    height: FLOATING_NAV_BAR.capsuleHeight,
    borderRadius: FLOATING_NAV_BAR.capsuleRadius,
    borderWidth: BORDER_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
});
