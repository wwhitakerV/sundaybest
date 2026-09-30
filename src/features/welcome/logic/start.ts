/**
 * Where Get a plan now goes: Home — and, for someone with no plans yet,
 * straight on to paste a sermon, so their first plan is one step away.
 */
export function getStartRoutes(
  hasPlans: boolean,
): ("/(tabs)/home" | "/(plan-creation)/paste-sermon")[] {
  return hasPlans ? ["/(tabs)/home"] : ["/(tabs)/home", "/(plan-creation)/paste-sermon"];
}
