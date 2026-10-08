import { addDays } from "@/utils/dates/addDays";
import { formatShortDate } from "@/utils/dates/formatShortDate";
import { formatWeekday } from "@/utils/dates/formatWeekday";

/** A calendar date (`2026-09-23`) read as UTC, as dates are stored. */
function at(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function format(date: string, options: Intl.DateTimeFormatOptions): string {
  return at(date).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });
}

/**
 * The week navigator's title, in two parts — a lead and the range, set
 * quieter: "September" "20–26" within a month, "Aug 30 –" "Sep 5" across two.
 */
export function getWeekTitle(start: string, end: string): { lead: string; range: string } {
  if (start.slice(0, 7) === end.slice(0, 7)) {
    return {
      lead: format(start, { month: "long" }),
      range: `${at(start).getUTCDate()}–${at(end).getUTCDate()}`,
    };
  }
  return { lead: `${formatShortDate(start)} –`, range: formatShortDate(end) };
}

/** A day relative to today: "Today, Sep 23", "Tomorrow, Sep 24", or "Sat, Sep 26". */
export function describeDate(date: string, today: string): string {
  const name =
    date === today ? "Today" : date === addDays(today, 1) ? "Tomorrow" : formatWeekday(date);
  return `${name}, ${formatShortDate(date)}`;
}
