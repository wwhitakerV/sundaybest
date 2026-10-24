import type { ApiPlanSummary } from "@/core/api/contracts";
import { getApiCompletedPlans, getApiUserPlans } from "./api-plan-collections";

/**
 * The Plans tab's pages, in order: the plans under way, the one most lately
 * studied first; then those ready to start, newest first; then those
 * finished, the most lately finished first.
 */
export function orderPlanPages(plans: readonly ApiPlanSummary[]): ApiPlanSummary[] {
  const yours = getApiUserPlans(plans);
  const underWay = yours
    .filter((plan) => plan.status === "active")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const ready = yours.filter((plan) => plan.status === "ready");
  return [...underWay, ...ready, ...getApiCompletedPlans(plans)];
}
