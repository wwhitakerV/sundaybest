import { Pressable, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import type { LucideIcon } from "lucide-react-native";

import { useTheme } from "@/theme";
import { headerButtonEntrance } from "./header-button-entrance";
import { useHeaderEntrance } from "./header-entrance";
import { useHeaderSide } from "./header-side";

const SIZE = 49;
const RADIUS = 25;
const DEFAULT_ICON_SIZE = 23;

export type HeaderIconButtonProps = {
  icon: LucideIcon;
  accessibilityLabel: string;
  onPress: () => void;
  /** Overrides the default 23pt icon size — used by the smaller `Type` icon. */
  size?: number;
  /** Draws the hairline border. Defaults to true; the top-level screens'
   * right-side icons (account, search) turn it off. */
  bordered?: boolean;
  /**
   * Floating over a colour of the content's own rather than the page: `dark`
   * over a dark colour (a dark fill, a light icon), `light` over a light one.
   * No border.
   */
  overlay?: "light" | "dark";
  testID?: string;
};

/**
 * The circular icon button every header uses: back, close, more, text
 * controls, search. White fill, centered icon — one place
 * for that chrome so every header stays visually consistent. Bordered by
 * default; borderless for the top-level screens' right-side icons.
 *
 * Arrives with its screen: a quick fade, a few points' slide in from its own
 * side of the header, and a small spring up to full size
 * (`headerButtonEntrance`). Its screen decides when (`useHeaderEntrance`):
 * each time the app arrives at it, except switching between tab roots.
 */
export function HeaderIconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  size = DEFAULT_ICON_SIZE,
  bordered = true,
  overlay,
  testID,
}: HeaderIconButtonProps) {
  const theme = useTheme();
  const side = useHeaderSide();
  const { arrivals, animate } = useHeaderEntrance();

  return (
    // A new key is a new view: it comes in afresh, with its entrance or without.
    <Animated.View
      key={arrivals}
      {...(testID !== undefined && { testID: `${testID}-entrance` })}
      {...(animate && { entering: headerButtonEntrance(side) })}
    >
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={[
          styles.button,
          {
            backgroundColor:
              overlay === "dark"
                ? theme.colors.overlayButtonDark
                : overlay === "light"
                  ? theme.colors.overlayButtonLight
                  : theme.colors.background,
            borderColor: bordered && !overlay ? theme.colors.hairline : "transparent",
          },
        ]}
      >
        <Icon
          size={size}
          color={
            overlay === "dark"
              ? theme.colors.inkOnDark
              : overlay === "light"
                ? theme.colors.inkOnLight
                : theme.colors.chromeIcon
          }
          strokeWidth={theme.icon.strokeWidth}
        />
      </Pressable>
    </Animated.View>
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
