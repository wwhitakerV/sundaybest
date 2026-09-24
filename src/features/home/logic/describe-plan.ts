import type { Plan } from "@/types/domain";
import type { PlanProgress } from "@/core/store";
import { formatShortDate } from "@/utils/dates/formatShortDate";

/**
 * The line under a plan's title in a list — where it stands: when it
 * finished, which day it's on, or how long it runs.
 */
export function describePlan(plan: Plan, progress: PlanProgress | null): string {
  const days = `${plan.lengthDays} ${plan.lengthDays === 1 ? "day" : "days"}`;
  if (plan.status === "completed" && plan.completedAt) {
    return `Finished ${formatShortDate(plan.completedAt)}`;
  }
  if (plan.status === "active" && progress) {
    return `Day ${progress.currentDayNumber} of ${progress.totalDays}`;
  }
  if (plan.isSample) return `Sample plan, ${days}`;
  return days;
}
