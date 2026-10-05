/**
 * Routes inside the New Plan modal. Pure: they describe a destination; the
 * caller navigates. Their params are read back by the receiving screen.
 */

/** Preparing: the server-side generation job for the new plan. */
export function preparingHref(planId: string, generationId: string) {
  return {
    pathname: "/(plan-creation)/preparing",
    params: { planId, generationId },
  } as const;
}

/** Plan Ready: the plan just built. */
export function planReadyHref(planId: string) {
  return { pathname: "/(plan-creation)/ready", params: { planId } } as const;
}
