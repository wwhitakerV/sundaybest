import type { ApiPlanSummary } from "@/core/api/contracts";
import { formatDayOfTotal, formatPlanLength } from "@/entities/plan";
import { formatShortDate } from "@/utils/dates/formatShortDate";

export function describeApiPlan(plan: ApiPlanSummary): string {
  const days = formatPlanLength(plan.lengthDays);
  if (plan.status === "completed" && plan.completedAt) {
    return `Finished ${formatShortDate(plan.completedAt)}`;
  }
  if (plan.status === "active" && plan.progress.currentDayNumber !== null) {
    return formatDayOfTotal(plan.progress.currentDayNumber, plan.lengthDays);
  }
  if (plan.isSample) return `Sample plan, ${days}`;
  return days;
}

export type ApiLibraryPlanLook = {
  status: string;
  detail: string;
  summary: string;
};

export function describeApiLibraryPlan(plan: ApiPlanSummary): ApiLibraryPlanLook {
  let status: string;
  let detail: string;

  if (plan.status === "completed") {
    status = "Done";
    detail = plan.completedAt ? `Finished ${formatShortDate(plan.completedAt)}` : "Finished";
  } else if (plan.status === "active") {
    status = "In progress";
    detail = formatDayOfTotal(plan.progress.currentDayNumber ?? 1, plan.lengthDays);
  } else {
    status = "Not started";
    detail = formatPlanLength(plan.lengthDays);
  }

  return { status, detail, summary: `${status} · ${detail}` };
}
