import type { ReactNode } from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { useDriftIn } from "@/hooks/use-drift-in";

/** Where a part starts from: a touch up and to the left of its place. */
const FROM = { x: -6, y: -8 } as const;

export type DriftInProps = {
  /** Changes to bring it in again — a new page. */
  revealKey: unknown;
  /** Its place in the page's order, from 0: each comes a beat behind the one before. */
  order: number;
  /** In place at once — with motion reduced. */
  still?: boolean;
  children: ReactNode;
  testID?: string;
};

/**
 * Brings what it holds in calmly: fading up as it drifts down and a touch
 * to the right into its place, eased to a soft stop. All on the UI thread.
 */
export function DriftIn({ revealKey, order, still = false, children, testID }: DriftInProps) {
  const progress = useDriftIn(revealKey, order, still);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      // `+ 0` so a part at rest sits at 0, not −0.
      { translateX: (1 - progress.value) * FROM.x + 0 },
      { translateY: (1 - progress.value) * FROM.y + 0 },
    ],
  }));

  return (
    <Animated.View testID={testID} style={style}>
      {children}
    </Animated.View>
  );
}
