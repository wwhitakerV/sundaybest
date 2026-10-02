import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { controlHeight, radius, space, useTheme } from "@/theme";
import { SFProLabel } from "@/ui/typography/SFProLabel";

type ButtonVariant = "primary" | "soft" | "secondary";

const ICON_SIZE = 20;

export type ButtonProps = {
  label: string;
  /** An icon before the label, e.g. `ListChecks`. */
  icon?: LucideIcon;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Its action is under way: a spinner in place of its words, and no second press. */
  loading?: boolean;
  /** Forwarded to the outermost pressable so callers can find it in tests. */
  testID?: string;
};

/**
 * `primary`: filled pill, for the one main action on a screen.
 * `soft`: a quieter pill — a soft fill and a hairline edge — for a second
 * action beside a primary one.
 * `secondary`: text-only, no fill or border, for a lower-emphasis action
 * alongside a primary button.
 */
export function Button({
  label,
  icon: Icon,
  onPress,
  variant = "primary",
  disabled,
  loading = false,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === "primary";
  const ink = isPrimary ? theme.colors.onControlPrimary : theme.colors.text;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[
        styles.base,
        isPrimary && [styles.pill, { backgroundColor: theme.colors.controlPrimary }],
        variant === "soft" && [
          styles.pill,
          styles.soft,
          {
            backgroundColor: theme.colors.segmentBackground,
            borderColor: theme.colors.containerBorder,
          },
        ],
        variant === "secondary" && styles.secondary,
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator {...(testID && { testID: `${testID}-spinner` })} color={ink} />
      ) : (
        <>
          {Icon && (
            <Icon
              {...(testID && { testID: `${testID}-icon` })}
              size={ICON_SIZE}
              color={ink}
              strokeWidth={theme.icon.strokeWidth}
            />
          )}
          <SFProLabel tone={isPrimary ? "onControlPrimary" : "text"}>{label}</SFProLabel>
        </>
      )}
    </Pressable>
  );
}

// Spec (320px reference x1.228125): primary 50h/26r -> 61/32,
// secondary 32h -> 39 (its own: nothing else is that tall).
const styles = StyleSheet.create({
  base: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space[12],
  },
  pill: {
    height: controlHeight.button,
    borderRadius: radius[32],
  },
  soft: { borderWidth: 1 },
  secondary: {
    height: 39,
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.5,
  },
});
