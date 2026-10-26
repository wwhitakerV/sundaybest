/**
 * Plan Detail inside Home's own stack — where Home's plan card opens it, so
 * iOS's zoom transition can run (it needs the source and destination in one
 * stack). Pure: it only describes the destination.
 */
export function homePlanOverviewHref(planId: string) {
  return { pathname: "/(tabs)/home/[planId]", params: { planId } } as const;
}

/**
 * Formation's versions, as the menu lists them: vIdeal 2, its board a track;
 * vIdeal, drawn whole; those named after their artworks (form-4…8); and vLine.
 */
export const FORMATION_VERSIONS = ["Ideal 2", "Ideal", "4", "5", "6", "7", "8", "Line"] as const;

/** Formation, the journey board — version `v` — in Home's own stack, the tab bar under it. */
export function homeFormationHref(v: string) {
  return { pathname: "/(tabs)/home/formation", params: { v } } as const;
}
