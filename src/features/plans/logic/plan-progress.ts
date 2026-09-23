import type { Plan } from "../types";

/**
 * The lowest-numbered day (1-indexed) not yet in `completedDays`, or
 * `undefined` once every day from 1 to `totalDays` is done. Order and
 * duplicates in `completedDays` don't matter. Never assume a fixed plan
 * length — a plan is 1 to 7 days long.
 */
export function getNextIncompleteDay(
  totalDays: number,
  completedDays: readonly number[],
): number | undefined {
  const completed = new Set(completedDays);

  for (let day = 1; day <= totalDays; day += 1) {
    if (!completed.has(day)) return day;
  }

  return undefined;
}

/**
 * The day to offer next once `finishedDay` is done, or `undefined` if that
 * finishes the plan. The finished day is folded in without mutating `plan`.
 */
export function getNextDayAfterCompleting(
  plan: Pick<Plan, "totalDays" | "completedDays">,
  finishedDay: number,
): number | undefined {
  return getNextIncompleteDay(plan.totalDays, [...plan.completedDays, finishedDay]);
}
