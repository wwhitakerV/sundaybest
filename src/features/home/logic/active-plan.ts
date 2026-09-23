import type { Plan } from "@/features/plans";

/**
 * The plan Home should surface: the first one not yet completed, or none.
 * `hasActivePlanOverride` forces the "no active plan" state (false) for
 * testing; `true` still needs an incomplete plan to exist.
 */
export function getActivePlan(
  plans: readonly Plan[],
  hasActivePlanOverride?: boolean,
): Plan | undefined {
  const hasActivePlan = hasActivePlanOverride ?? plans.some((plan) => !plan.completed);

  return hasActivePlan ? plans.find((plan) => !plan.completed) : undefined;
}
