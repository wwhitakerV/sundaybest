import type { Weekday } from "@/types/domain";

/** The week, Sunday first, as a reminder's days are kept. */
export const WEEK: readonly Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/**
 * A reminder's days with one picked or left out, in the week's order. The
 * last day can't be left out — a reminder always has one — so the same days
 * come back unchanged.
 */
export function toggleReminderDay(days: readonly Weekday[], day: Weekday): readonly Weekday[] {
  if (days.includes(day)) {
    return days.length === 1 ? days : days.filter((candidate) => candidate !== day);
  }
  return WEEK.filter((candidate) => candidate === day || days.includes(candidate));
}
