import { Pressable, StyleSheet } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { controlHeight, radius, space, useTheme } from "@/theme";
import { SFProLabel } from "@/ui/typography/SFProLabel";
import { toneColor, type Tone } from "../typography/tone";

const HEIGHT = controlHeight.hitTarget;

export type CompactButtonProps = {
  label: string;
  /** An icon beside the label, e.g. `Play`. */
  icon?: LucideIcon;
  /** Which side of the label the icon sits: before it (the default), or after, as a way forward. */
  iconPosition?: "start" | "end";
  /** Just the icon, in a circle — still named by `label` for a screen reader. */
  iconOnly?: boolean;
  /**
   * The ink of the colour it sits on: `light` for a dark colour (a white
   * button, dark words), `dark` for a light one (a black button, white words).
   * `accent` is the brand red with white words, for the one action a featured
   * card leads to.
   * `soft` is a quiet pill — a soft fill, a hairline edge, dark words — beside
   * a black one.
   */
  tone: "light" | "dark" | "accent" | "soft";
  /** Where it sits in its row: centred (the default), or at the start. */
  align?: "center" | "start";
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
  iconPosition = "start",
  tone,
  align = "center",
  onPress,
  testID,
}: CompactButtonProps) {
  const theme = useTheme();
  const fill =
    tone === "accent"
      ? theme.colors.accent
      : tone === "soft"
        ? theme.colors.segmentBackground
        : tone === "light"
          ? theme.colors.inkOnDark
          : theme.colors.inkOnLight;
  const inkTone: Tone = tone === "light" || tone === "soft" ? "inkOnLight" : "inkOnDark";
  const ink = toneColor(theme.colors, inkTone);
  const icon = Icon && (
    <Icon size={iconOnly ? 20 : 16} color={ink} strokeWidth={theme.icon.strokeWidth} />
  );

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.button,
        iconOnly && styles.round,
        align === "start" && styles.start,
        { backgroundColor: fill, borderRadius: radius.pill },
        tone === "soft" && [styles.soft, { borderColor: theme.colors.containerBorder }],
      ]}
    >
      {iconPosition === "start" && icon}
      {!iconOnly && (
        <SFProLabel variant="compactButton" tone={inkTone}>
          {label}
        </SFProLabel>
      )}
      {iconPosition === "end" && icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: HEIGHT,
    paddingHorizontal: space[22],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space[8],
    alignSelf: "center",
  },
  round: { width: HEIGHT, paddingHorizontal: 0 },
  soft: { borderWidth: 1 },
  start: { alignSelf: "flex-start" },
});
