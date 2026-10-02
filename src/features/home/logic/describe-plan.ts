import type { Plan } from "@/types/domain";
import type { PlanProgress } from "@/core/store";
import { formatDayOfTotal, formatPlanLength } from "@/entities/plan";
import { formatShortDate } from "@/utils/dates/formatShortDate";

/**
 * The line under a plan's title in a list — where it stands: when it
 * finished, which day it's on, or how long it runs.
 */
export function describePlan(plan: Plan, progress: PlanProgress | null): string {
  const days = formatPlanLength(plan.lengthDays);
  if (plan.status === "completed" && plan.completedAt) {
    return `Finished ${formatShortDate(plan.completedAt)}`;
  }
  if (plan.status === "active" && progress) {
    return formatDayOfTotal(progress.currentDayNumber, progress.totalDays);
  }
  if (plan.isSample) return `Sample plan, ${days}`;
  return days;
}
