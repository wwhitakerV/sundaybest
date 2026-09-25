import type { Id, IsoDate, Plan, PlanDay, Weekday } from "@/types/domain";

import { addDays, compareIso, getWeekday, getWeekStart, listDates, toIsoDate } from "../dates";
import type { AppState } from "../state";
import { findById, listAll } from "../table";
import { getActivePlan, getCurrentPlanDay, getPlanDays } from "./plans";

/** How far through one plan the user is — all worked out from its days. */
export type PlanProgress = {
  planId: Id;
  totalDays: number;
  completedDayCount: number;
  remainingDayCount: number;
  /** Days done out of the plan's length, 0–100, rounded. */
  completionPercentage: number;
  completedDayNumbers: number[];
  /** The first day not yet done, or the last once all are. */
  currentDayNumber: number;
};

export function getPlanProgress(state: AppState, planId: Id): PlanProgress | null {
  const plan = findById(state.plans, planId);
  if (!plan) return null;
  const days = getPlanDays(state, planId);
  const completedDayNumbers = days
    .filter((day) => day.status === "completed")
    .map((day) => day.dayNumber);
  const completedDayCount = completedDayNumbers.length;
  const totalDays = plan.lengthDays;
  return {
    planId,
    totalDays,
    completedDayCount,
    remainingDayCount: Math.max(0, totalDays - completedDayCount),
    completionPercentage: Math.round((completedDayCount / totalDays) * 100),
    completedDayNumbers,
    currentDayNumber:
      days.find((day) => day.status !== "completed")?.dayNumber ??
      Math.min(totalDays, 1 + completedDayCount),
  };
}

/** Every finished day, across every plan, in the order they were finished. */
export function getCompletedDays(state: AppState): PlanDay[] {
  return listAll(state.planDays)
    .filter((day) => day.completedAt !== null)
    .sort((a, b) => compareIso(a.completedAt ?? "", b.completedAt ?? ""));
}

/** The calendar days a study day was finished on, earliest first, each once. */
export function getStudyDates(state: AppState): IsoDate[] {
  const dates = getCompletedDays(state).flatMap((day) =>
    day.completedAt ? [toIsoDate(day.completedAt)] : [],
  );
  return [...new Set(dates)];
}

/** How many study days were finished on one calendar day. */
export type DayActivity = { date: IsoDate; weekday: Weekday; completedDayCount: number };

/** Each day from `start` to `end` (both included) and what was finished on it. */
export function getProgressForDateRange(
  state: AppState,
  start: IsoDate,
  end: IsoDate,
): DayActivity[] {
  const finishedOn = getCompletedDays(state).flatMap((day) =>
    day.completedAt ? [toIsoDate(day.completedAt)] : [],
  );
  return listDates(start, end).map((date) => ({
    date,
    weekday: getWeekday(date),
    completedDayCount: finishedOn.filter((finished) => finished === date).length,
  }));
}

/** The week (Sunday to Saturday) that holds `date`, day by day. */
export function getWeeklyCompletionCounts(state: AppState, date: IsoDate): DayActivity[] {
  const start = getWeekStart(date);
  return getProgressForDateRange(state, start, addDays(start, 6));
}

export type Streak = {
  /**
   * Days in a row with a finished study day, ending today — or yesterday, so
   * a streak isn't lost before today's study is done.
   */
  current: number;
  longest: number;
};

export function getStreak(state: AppState, today: IsoDate): Streak {
  const dates = getStudyDates(state);
  const studied = new Set(dates);

  let longest = 0;
  for (const date of dates) {
    if (studied.has(addDays(date, -1))) continue;
    let run = 1;
    while (studied.has(addDays(date, run))) run += 1;
    longest = Math.max(longest, run);
  }

  let current = 0;
  let day = studied.has(today) ? today : addDays(today, -1);
  while (studied.has(day)) {
    current += 1;
    day = addDays(day, -1);
  }

  return { current, longest };
}

/** The study to do next: the plan under way, its day, and the date it's for. */
export type UpNext = { plan: Plan; day: PlanDay; date: IsoDate };

/**
 * What's up next: the active plan's current day — today, or tomorrow once a
 * day's been finished today (one a day is the plan's pace). Nothing without
 * a plan under way.
 */
export function getUpNext(state: AppState, today: IsoDate): UpNext | null {
  const plan = getActivePlan(state);
  const day = plan ? getCurrentPlanDay(state, plan.id) : null;
  if (!plan || !day || day.status === "completed") return null;
  const studiedToday = getStudyDates(state).includes(today);
  return { plan, day, date: studiedToday ? addDays(today, 1) : today };
}

export type ProgressTotals = { completedDayCount: number; completedPlanCount: number };

export function getProgressTotals(state: AppState): ProgressTotals {
  return {
    completedDayCount: getCompletedDays(state).length,
    completedPlanCount: listAll(state.plans).filter((plan) => plan.status === "completed").length,
  };
}
