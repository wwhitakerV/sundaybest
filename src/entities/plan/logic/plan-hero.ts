import type { PlanStatus } from "@/types/domain";
import { formatDay, formatDayOfTotal, formatPlanLength } from "./plan-wording";

/** The words around a plan in its hero: where it stands, the way on, and the day it's on. */
export type PlanHeroWords = {
  status: string;
  action: string;
  today: string;
  /** Today's day is done and the next isn't open yet: the way on waits (a lock, greyed). */
  waiting?: true;
};

/**
 * How a plan hero puts a plan in context — Plan Detail's, and Home's for the
 * plan under way: a quiet status line, the call to action, and what the day holds
 * — for a plan under way, one not started, or one finished.
 */
export function describePlanHero(input: {
  status: PlanStatus;
  currentDay: number;
  totalDays: number;
  dayTitle: string;
  minutes: number;
  /** The day it's on isn't open yet — today's is done; it opens tomorrow. */
  waiting?: boolean;
}): PlanHeroWords {
  const { status, currentDay, totalDays, dayTitle, minutes, waiting = false } = input;
  const length = formatPlanLength(totalDays).toUpperCase();
  const dayName = formatDay(currentDay);
  const day = `${dayTitle} · ${minutes} min`;
  if (status === "completed") {
    return {
      status: `COMPLETED · ${length}`,
      action: `Review ${dayName}`,
      today: `${dayName}: ${day}`,
    };
  }
  if (status === "active") {
    return {
      status: `IN PROGRESS · ${formatDayOfTotal(currentDay, totalDays).toUpperCase()}`,
      action: waiting ? `${dayName} tomorrow` : `Continue ${dayName}`,
      today: `Today: ${day}`,
      ...(waiting && { waiting: true as const }),
    };
  }
  return {
    status: `NOT STARTED · ${length}`,
    action: `Start ${dayName}`,
    today: `${dayName}: ${day}`,
  };
}
