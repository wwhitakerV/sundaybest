import type { PlanStatus } from "@/types/domain";

/** The words around a plan in Plan Detail's hero: where it stands, the way on, and the day it's on. */
export type PlanHeroWords = { status: string; action: string; today: string };

/**
 * How Plan Detail's hero puts a plan in context, as Home's does for the plan
 * under way: a quiet status line, the call to action, and what the day holds
 * — for a plan under way, one not started, or one finished.
 */
export function describePlanHero(input: {
  status: PlanStatus;
  currentDay: number;
  totalDays: number;
  dayTitle: string;
  minutes: number;
}): PlanHeroWords {
  const { status, currentDay, totalDays, dayTitle, minutes } = input;
  const length = `${totalDays} ${totalDays === 1 ? "DAY" : "DAYS"}`;
  const day = `${dayTitle} · ${minutes} min`;
  if (status === "completed") {
    return {
      status: `COMPLETED · ${length}`,
      action: `Review Day ${currentDay}`,
      today: `Day ${currentDay}: ${day}`,
    };
  }
  if (status === "active") {
    return {
      status: `IN PROGRESS · DAY ${currentDay} OF ${totalDays}`,
      action: `Continue Day ${currentDay}`,
      today: `Today: ${day}`,
    };
  }
  return {
    status: `NOT STARTED · ${length}`,
    action: `Start Day ${currentDay}`,
    today: `Day ${currentDay}: ${day}`,
  };
}
