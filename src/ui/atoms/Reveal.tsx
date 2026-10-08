import type { ReactNode } from "react";
import Animated, { Easing, FadeInUp, FadeOut } from "react-native-reanimated";

import { motion } from "@/theme";

const { durationMs, staggerMs, fromY, exitMs } = motion.reveal;

/** In: from just above, fading in as it drifts down into place, `order` beats behind the first. */
function revealEntering(order: number) {
  return FadeInUp.withInitialValues({ opacity: 0, transform: [{ translateY: -fromY }] })
    .duration(durationMs)
    .delay(order * staggerMs)
    .easing(Easing.out(Easing.cubic));
}

/** Out: everything together, quicker than it came. */
const REVEAL_EXITING = FadeOut.duration(exitMs);

export type RevealProps = {
  /** Its place among what's revealed, from 0 at the top: each comes a beat behind the one above. */
  order: number;
  children: ReactNode;
  testID?: string;
};

/**
 * Something a switch shows: mount it when it's on. It cascades in — fading,
 * drifting down a little — and fades out faster when it's turned off.
 * Reanimated skips both under Reduce Motion.
 */
export function Reveal({ order, children, testID }: RevealProps) {
  return (
    <Animated.View testID={testID} entering={revealEntering(order)} exiting={REVEAL_EXITING}>
      {children}
    </Animated.View>
  );
}
