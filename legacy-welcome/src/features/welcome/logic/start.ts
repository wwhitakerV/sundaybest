import { NEW_PLAN_HREF, HOME_HREF } from "@/entities/plan";

/**
 * Where Get a plan now goes: Home — and, for someone with no plans yet,
 * straight on to paste a sermon, so their first plan is one step away.
 */
export function getStartRoutes(hasPlans: boolean): (typeof HOME_HREF | typeof NEW_PLAN_HREF)[] {
  return hasPlans ? [HOME_HREF] : [HOME_HREF, NEW_PLAN_HREF];
}
