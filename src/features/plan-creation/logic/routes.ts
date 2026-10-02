/**
 * Routes inside the New Plan modal. Pure: they describe a destination; the
 * caller navigates. Their params are read back with `parsePlanParams`.
 */

/** Preparing: the plan being built. */
export function preparingHref(planId: string) {
  return { pathname: "/(plan-creation)/preparing", params: { planId } } as const;
}

/** Plan Ready: the plan just built. */
export function planReadyHref(planId: string) {
  return { pathname: "/(plan-creation)/ready", params: { planId } } as const;
}
