import { Pressable, StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { FLOATING_NAV_BAR } from "../organisms/floatingNavBar";
import { SFProLabel } from "@/ui/typography/SFProLabel";
import { toneColor, type Tone } from "../typography/tone";

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
  /** A way on that isn't open yet (a day tomorrow): opaque grey, grey words, edged as lightly as the bar. */
  waiting?: boolean;
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
 * black; `waiting`, a way on that isn't open yet, it's opaque grey. The same button sits beside the gathered tab bar or alone over a
 * screen. Fills the width it's given.
 */
export function FloatingButton({
  label,
  icon: Icon,
  primary = false,
  quiet = false,
  waiting = false,
  disabled = false,
  onPress,
  testID,
}: FloatingButtonProps) {
  const theme = useTheme();
  const edge = quiet || waiting ? theme.colors.hairline : theme.colors.borderStrong;
  const tone: Tone = primary ? "onControlPrimary" : waiting ? "waitingInk" : "text";
  const ink = toneColor(theme.colors, tone);

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
          backgroundColor: primary
            ? theme.colors.controlPrimary
            : waiting
              ? theme.colors.waitingFill
              : theme.colors.background,
          borderColor: primary ? theme.colors.controlPrimary : edge,
          gap: space[8],
        },
        disabled && styles.disabled,
      ]}
    >
      {Icon && (
        <View testID={`${testID}-icon`}>
          <Icon
            size={ICON_SIZE}
            color={primary || waiting ? ink : theme.colors.chromeIcon}
            strokeWidth={theme.icon.strokeWidth}
          />
        </View>
      )}
      <SFProLabel numberOfLines={1} tone={tone}>
        {label}
      </SFProLabel>
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
    paddingHorizontal: space[20],
  },
});
