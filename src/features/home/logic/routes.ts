/**
 * Plan Detail inside Home's own stack — where Home's plan card opens it, so
 * iOS's zoom transition can run (it needs the source and destination in one
 * stack). Pure: it only describes the destination.
 */
export function homePlanOverviewHref(planId: string) {
  return { pathname: "/(tabs)/home/[planId]", params: { planId } } as const;
}

/** New Plan's first step — where the tab bar's + and Home's start card go. */
export const NEW_PLAN_HREF = "/(plan-creation)/paste-sermon";
