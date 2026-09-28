import type { Id } from "@/types/domain";
import {
  getActivePlan,
  getPlanDays,
  getQuizForDay,
  getScriptureForDay,
  getUserPlans,
  useAppSelector,
} from "@/core/store";
import {
  PLAN_PICK_LIMIT,
  getPlanPickActivities,
  getReachedDaysNewestFirst,
  putActivePlanFirst,
  type PlanPickActivity,
} from "../logic/plan-picks";

/** One day from the user's plans, as the "From your plans" rail shows it. */
export type PlanPick = {
  planId: Id;
  dayId: Id;
  dayNumber: number;
  title: string;
  /** Its Scripture's citation ("Joshua 24:15"), once it has one. */
  reference: string | null;
  /** The opening of its reading. */
  detail: string;
  activities: PlanPickActivity[];
};

/**
 * The days the user has reached in their plans — the one under way first,
 * each plan's newest day first — with what each offers to do again.
 */
export function usePlanPicks(): PlanPick[] {
  return useAppSelector((state) => {
    const plans = putActivePlanFirst(getUserPlans(state), getActivePlan(state)?.id ?? null);
    return plans
      .flatMap((plan) =>
        getReachedDaysNewestFirst(getPlanDays(state, plan.id)).map((day) => ({
          planId: plan.id,
          dayId: day.id,
          dayNumber: day.dayNumber,
          title: day.reading.title,
          reference: getScriptureForDay(state, day.id)?.reference ?? null,
          detail: day.reading.paragraphs.at(0) ?? "",
          activities: getPlanPickActivities(day, getQuizForDay(state, day.id) !== null),
        })),
      )
      .slice(0, PLAN_PICK_LIMIT);
  });
}
