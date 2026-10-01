import { Pressable, StyleSheet } from "react-native";

import { controlHeight, radius, useTheme } from "@/theme";
import { SFProLabel } from "@/ui/typography/SFProLabel";

type ButtonVariant = "primary" | "secondary";

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Forwarded to the outermost pressable so callers can find it in tests. */
  testID?: string;
};

/**
 * `primary`: filled pill, for the one main action on a screen.
 * `secondary`: text-only, no fill or border, for a lower-emphasis action
 * alongside a primary button.
 */
export function Button({ label, onPress, variant = "primary", disabled, testID }: ButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === "primary";

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        isPrimary
          ? [styles.primary, { backgroundColor: theme.colors.controlPrimary }]
          : styles.secondary,
        disabled && styles.disabled,
      ]}
    >
      <SFProLabel tone={isPrimary ? "onControlPrimary" : "text"}>{label}</SFProLabel>
    </Pressable>
  );
}

// Spec (320px reference x1.228125): primary 50h/26r -> 61/32,
// secondary 32h -> 39 (its own: nothing else is that tall).
const styles = StyleSheet.create({
  base: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    height: controlHeight.button,
    borderRadius: radius[32],
  },
  secondary: {
    height: 39,
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.5,
  },
});
