import type { IsoDate, IsoDateTime, Weekday } from "@/types/domain";
import { addDays } from "@/utils/dates/addDays";

const WEEKDAYS: readonly Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function toUtcMidnight(date: IsoDate): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

/**
 * The calendar day a moment falls on. Moments are stored in UTC, so for now
 * this is the UTC day; once real dates are recorded it should become the
 * user's own day.
 */
export function toIsoDate(at: IsoDateTime): IsoDate {
  return at.slice(0, 10);
}

/** `date` moved by `days` (negative goes back) — shared with the app from `utils`. */
export { addDays };

export function getWeekday(date: IsoDate): Weekday {
  return WEEKDAYS.at(toUtcMidnight(date).getUTCDay()) ?? "sun";
}

/** The Sunday that starts `date`'s week. */
export function getWeekStart(date: IsoDate): IsoDate {
  return addDays(date, -toUtcMidnight(date).getUTCDay());
}

/** Every day from `start` to `end`, both included; empty if `end` is before `start`. */
export function listDates(start: IsoDate, end: IsoDate): IsoDate[] {
  const dates: IsoDate[] = [];
  for (let date = start; date <= end; date = addDays(date, 1)) dates.push(date);
  return dates;
}

/** Orders ISO strings (dates and moments sort by time as text). */
export function compareIso(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}
