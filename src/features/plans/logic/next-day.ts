import type { PlanProgress } from "@/core/store";

/**
 * The day to offer after finishing `finishedDayNumber`: the plan's current
 * day — the first not yet done, which completing a day opens — unless the
 * plan is finished, or the finished day is somehow still the current one.
 */
export function getNextDayToStudy(
  progress: Pick<PlanProgress, "remainingDayCount" | "currentDayNumber">,
  finishedDayNumber: number,
): number | undefined {
  if (progress.remainingDayCount === 0) return undefined;
  return progress.currentDayNumber === finishedDayNumber ? undefined : progress.currentDayNumber;
}
