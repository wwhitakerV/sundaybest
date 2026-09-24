import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { Easing, FadeIn } from "react-native-reanimated";

/** Quick enough not to hold anything up, long enough to read as a fade, not a cut. */
const FADE_IN_MS = 220;

/** Eases out: most of the fade happens at once, and it settles gently. */
const FADE_IN = FadeIn.duration(FADE_IN_MS).easing(Easing.out(Easing.cubic));

export type FadeInViewProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A view whose contents fade in once, as it first appears, so a screen
 * arriving doesn't seem to jump into place. Layout is the caller's, through
 * `style`. Entering animations follow the system Reduce Motion setting on
 * their own: with it on, the contents simply appear.
 */
export function FadeInView({ children, style, testID }: FadeInViewProps) {
  return (
    <Animated.View testID={testID} entering={FADE_IN} style={style}>
      {children}
    </Animated.View>
  );
}
