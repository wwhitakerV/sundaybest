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

/** Where a plan stands, in two parts: what it is ("IN PROGRESS") and how far ("DAY 3 OF 7"). */
export type PlanStanding = { label: string; standing: string };

/**
 * A plan's standing as a featured plan sets it — the label at the left, how
 * far at the right: under way, the day it's on of all of them; otherwise, its
 * length.
 */
export function describePlanStanding(input: {
  status: PlanStatus;
  currentDay: number;
  totalDays: number;
}): PlanStanding {
  const { status, currentDay, totalDays } = input;
  if (status === "active") {
    return {
      label: "IN PROGRESS",
      standing: formatDayOfTotal(currentDay, totalDays).toUpperCase(),
    };
  }
  const length = formatPlanLength(totalDays).toUpperCase();
  return { label: status === "completed" ? "COMPLETED" : "NOT STARTED", standing: length };
}

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
  const { status, currentDay, dayTitle, minutes, waiting = false } = input;
  const { label, standing } = describePlanStanding(input);
  const dayName = formatDay(currentDay);
  const day = `${dayTitle} · ${minutes} min`;
  if (status === "completed") {
    return {
      status: `${label} · ${standing}`,
      action: `Review ${dayName}`,
      today: `${dayName}: ${day}`,
    };
  }
  if (status === "active") {
    return {
      status: `${label} · ${standing}`,
      action: waiting ? `${dayName} tomorrow` : `Continue ${dayName}`,
      today: `Today: ${day}`,
      ...(waiting && { waiting: true as const }),
    };
  }
  return {
    status: `${label} · ${standing}`,
    action: `Start ${dayName}`,
    today: `${dayName}: ${day}`,
  };
}
