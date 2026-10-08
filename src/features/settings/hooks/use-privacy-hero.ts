import { useState } from "react";

/**
 * Whether a privacy page's hero is still under its header, as the page
 * scrolls: the header's backdrop stays away until it isn't. Changes only as
 * the hero's foot crosses the header, so scrolling reaches React no more than
 * it must.
 */
export function usePrivacyHero() {
  // How far the page scrolls before the hero has gone from under the header.
  const [reach, setReach] = useState(Number.POSITIVE_INFINITY);
  const [overHero, setOverHero] = useState(true);

  return {
    overHero,
    onReach: setReach,
    onScroll: (y: number) => setOverHero(y < reach),
  } as const;
}
