import { useMemo } from "react";

import { makeBurstStreaks } from "@/utils/burst/makeBurstStreaks";
import { StreakBurst } from "../burst/StreakBurst";

const STREAK_COUNT = 7;
// A 100° upward fan: wide enough to feel like a burst, narrow enough that
// the outer streaks still climb clear of the bar without flying sideways.
const SPREAD_DEG = 100;
const LONG_LENGTH = 10;
const SHORT_LENGTH = 6;
/** How far past the bar's top edge the long and short streaks finish. */
const LONG_ABOVE_BAR = 18;
const SHORT_ABOVE_BAR = 9;
// Lucide draws on a 24-unit grid and its shapes start about 2 units in from
// the top of the box, so this puts the origin on the icon's visible top edge.
const LUCIDE_TOP_INSET_RATIO = 2 / 24;

export type TabIconBurstProps = {
  /** Bursts once each time this increments past 0 (`useActivationCount`). */
  activation: number;
  /** The icon's rendered size; the burst is centred on it horizontally. */
  iconSize: number;
  /** Distance from the icon's box top up to the bar's top edge, in points. */
  clearance: number;
  testID?: string;
};

/**
 * The burst released from the visible top edge of a tab icon, at its exact
 * horizontal centre, finishing above the tab bar. A `StreakBurst` aimed
 * upward and sized to clear the bar.
 */
export function TabIconBurst({ activation, iconSize, clearance, testID }: TabIconBurstProps) {
  const originY = iconSize * LUCIDE_TOP_INSET_RATIO;
  // From the origin (slightly below the box top) up to the bar's top edge.
  const rise = clearance + originY;

  const streaks = useMemo(
    () =>
      makeBurstStreaks({
        count: STREAK_COUNT,
        spreadDeg: SPREAD_DEG,
        // + half a length so the whole streak, not just its centre, clears the bar.
        longRise: rise + LONG_ABOVE_BAR + LONG_LENGTH / 2,
        longLength: LONG_LENGTH,
        shortRise: rise + SHORT_ABOVE_BAR + SHORT_LENGTH / 2,
        shortLength: SHORT_LENGTH,
      }),
    [rise],
  );

  return (
    <StreakBurst
      // Activation 0 is mount, which doesn't burst.
      trigger={activation === 0 ? null : activation}
      streaks={streaks}
      style={{ left: iconSize / 2, top: originY }}
      {...(testID && { testID })}
    />
  );
}
