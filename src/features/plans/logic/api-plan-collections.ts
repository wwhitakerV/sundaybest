import type { ApiPlanSummary } from "@/core/api/contracts";

export function getApiUserPlans(plans: readonly ApiPlanSummary[]): ApiPlanSummary[] {
  return [...plans]
    .filter((plan) => {
      if (plan.status === "archived") return false;
      if (plan.isSample) return plan.status === "active" || plan.status === "completed";
      return plan.status === "ready" || plan.status === "active" || plan.status === "completed";
    })
    .sort(byCreatedNewest);
}

export function getApiSamplePlan(plans: readonly ApiPlanSummary[]): ApiPlanSummary | null {
  return plans.find((plan) => plan.isSample && plan.status === "ready") ?? null;
}

export function getApiInProgressPlans(plans: readonly ApiPlanSummary[]): ApiPlanSummary[] {
  return getApiUserPlans(plans)
    .filter((plan) => plan.status === "active")
    .sort((a, b) => compareNullableIsoDesc(a.startedAt, b.startedAt));
}

export function getApiActivePlan(plans: readonly ApiPlanSummary[]): ApiPlanSummary | null {
  return getApiInProgressPlans(plans)[0] ?? null;
}

export function getApiCompletedPlans(plans: readonly ApiPlanSummary[]): ApiPlanSummary[] {
  return getApiUserPlans(plans)
    .filter((plan) => plan.status === "completed")
    .sort((a, b) => compareNullableIsoDesc(a.completedAt, b.completedAt));
}

function byCreatedNewest(a: ApiPlanSummary, b: ApiPlanSummary): number {
  return b.createdAt.localeCompare(a.createdAt);
}

function compareNullableIsoDesc(a: string | null, b: string | null): number {
  return (b ?? "").localeCompare(a ?? "");
}
