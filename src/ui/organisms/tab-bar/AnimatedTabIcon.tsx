import type { ReactNode } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";

import { TabIconBurst } from "./TabIconBurst";
import { useActivationCount } from "./use-activation-count";
import { useTabIconSpin } from "./use-tab-icon-spin";

export type AnimatedTabIconProps = {
  /** Plays the spin and burst each time this flips to true. */
  active: boolean;
  /** The icon's rendered size. The wrapper is exactly this square, so the
   * burst's coordinates are the icon's own. */
  iconSize: number;
  /** Distance from the icon's top edge up to the bar's top edge, in points. */
  burstClearance: number;
  children: ReactNode;
  testID?: string;
};

/**
 * Wraps a tab's icon so that, as its tab becomes active, the icon coin-spins
 * and releases a burst of streaks from its top-centre that finishes above the
 * bar. The burst sits outside the spinning view so it doesn't turn with the
 * coin, and is drawn first so it emerges from behind the icon.
 */
export function AnimatedTabIcon({
  active,
  iconSize,
  burstClearance,
  children,
  testID,
}: AnimatedTabIconProps) {
  const activation = useActivationCount(active);
  const spinStyle = useTabIconSpin(activation);

  return (
    <View style={{ width: iconSize, height: iconSize }}>
      <TabIconBurst
        activation={activation}
        iconSize={iconSize}
        clearance={burstClearance}
        {...(testID && { testID: `${testID}-burst` })}
      />
      <Animated.View testID={testID} style={spinStyle}>
        {children}
      </Animated.View>
    </View>
  );
}
