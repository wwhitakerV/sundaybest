/**
 * Shared geometry for every floating pill nav bar fixed to a screen's
 * bottom edge — the main tab bar (`TabBar`) and the study flow's step
 * pager (`StudyNav`) both build on this same capsule, so the two stay
 * visually identical without duplicating the numbers.
 */
export const FLOATING_NAV_BAR = {
  capsuleHeight: 62,
  capsuleRadius: 33,
  capsuleHPadding: 7,
  capsuleVPadding: 7,
  sideMargin: 17,
  bottomMargin: 22,
} as const;

/**
 * Every bar's capsule sits this far below the safe area's bottom edge — a
 * little way into the home indicator's strip, close to the screen's edge.
 */
const BELOW_SAFE_AREA = 6;

/**
 * How far above the screen's bottom edge every floating bar's capsule sits,
 * given the safe area's bottom inset — one rule, so the tab bar (open or
 * minimised) and the study pager land in exactly the same place.
 */
export function getFloatingNavBarBottom(insetBottom: number): number {
  return Math.max(insetBottom, FLOATING_NAV_BAR.bottomMargin) - BELOW_SAFE_AREA;
}

/** How far above a bar's capsule the tint behind it reaches. */
const TINT_ABOVE_CAPSULE = 16;

/** How tall the tint behind a bar is: from the screen's bottom edge to a little above its capsule. */
export function getFloatingNavBarTintHeight(capsuleBottom: number): number {
  return capsuleBottom + FLOATING_NAV_BAR.capsuleHeight + TINT_ABOVE_CAPSULE;
}
