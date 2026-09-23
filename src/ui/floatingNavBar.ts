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
