import type { ReactNode } from "react";
import type { ViewStyle } from "react-native";
import Animated, { type CSSStyle } from "react-native-reanimated";

import { motion } from "@/theme";

const { durationMs, staggerMs, fromX } = motion.pageEnter;

const ENTER = {
  from: { opacity: 0, transform: [{ translateX: fromX }] },
  to: { opacity: 1, transform: [{ translateX: 0 }] },
};
const FADE = { from: { opacity: 0 }, to: { opacity: 1 } };

/**
 * A part's entrance, as a Reanimated CSS animation: from nothing, it fades
 * in as it moves left into place (only fades, with motion reduced), `order`
 * beats behind the first. `backwards` holds it at its start through the
 * delay, so it's never seen before it begins.
 */
export function getPageEnterAnimation(order: number, still: boolean): CSSStyle<ViewStyle> {
  return {
    animationName: still ? FADE : ENTER,
    animationDuration: durationMs,
    animationDelay: order * staggerMs,
    animationTimingFunction: "ease-out",
    animationFillMode: "backwards",
  };
}

export type PageEnterProps = {
  /** Its place in the page, from 0: each part comes a beat behind the one before. */
  order: number;
  /** With motion reduced: it fades, without moving. */
  still?: boolean;
  children: ReactNode;
  testID?: string;
};

/**
 * One part of a page arriving. The entrance is declared in its style, so it
 * plays — natively — every time it mounts, with nothing to trigger and
 * nothing to compare: key the page to play it again for a new one.
 */
export function PageEnter({ order, still = false, children, testID }: PageEnterProps) {
  return (
    <Animated.View testID={testID} style={getPageEnterAnimation(order, still)}>
      {children}
    </Animated.View>
  );
}
