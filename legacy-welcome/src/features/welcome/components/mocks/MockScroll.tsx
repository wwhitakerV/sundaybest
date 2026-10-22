import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

import { useScrollTo } from "../../hooks/use-scroll-to";

export type MockScrollProps = {
  /** How far the content is scrolled, in design points (0 = top). */
  scrollY: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * A mock screen's scrolling content: eases to each new `scrollY`, starting
 * where it's told on mount — so a new `key` (a new step's page) starts
 * there at once rather than scrolling to it.
 */
export function MockScroll({ scrollY, style, children }: MockScrollProps) {
  const scrollStyle = useScrollTo(scrollY);

  return <Animated.View style={[style, scrollStyle]}>{children}</Animated.View>;
}
