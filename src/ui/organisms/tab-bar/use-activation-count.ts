import { useState } from "react";

/**
 * Counts the times `active` has flipped from false to true since mount —
 * starting at 0, so being active on first render doesn't count. Animations
 * key off the count, so each activation plays once and nothing plays on
 * mount. Derived during render (React's "adjust state on prop change"
 * pattern) rather than in an effect, so there's no extra render pass.
 */
export function useActivationCount(active: boolean): number {
  const [previousActive, setPreviousActive] = useState(active);
  const [count, setCount] = useState(0);

  if (active !== previousActive) {
    setPreviousActive(active);
    if (active) setCount(count + 1);
  }

  return count;
}
