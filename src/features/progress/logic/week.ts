import { addDays } from "@/utils/dates/addDays";

/** A calendar date (`2026-09-23`) read as UTC, as dates are stored. */
function at(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function format(date: string, options: Intl.DateTimeFormatOptions): string {
  return at(date).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });
}

/** `Sep 23`. */
function shortDate(date: string): string {
  return format(date, { month: "short", day: "numeric" });
}

/** `Tue`. */
export function getWeekdayLabel(date: string): string {
  return format(date, { weekday: "short" });
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
  return { lead: `${shortDate(start)} –`, range: shortDate(end) };
}

/** A day relative to today: "Today, Sep 23", "Tomorrow, Sep 24", or "Sat, Sep 26". */
export function describeDate(date: string, today: string): string {
  const name =
    date === today ? "Today" : date === addDays(today, 1) ? "Tomorrow" : getWeekdayLabel(date);
  return `${name}, ${shortDate(date)}`;
}

/** What a screen reader says for a day of the week: when it is, and whether it was studied. */
export function describeWeekDay(date: string, today: string, studied: boolean): string {
  const when =
    date === today ? `Today, ${shortDate(date)}` : `${getWeekdayLabel(date)}, ${shortDate(date)}`;
  if (studied) return `${when}: studied`;
  if (date === today) return `${when}: not yet`;
  return `${when}: ${date < today ? "not studied" : "ahead"}`;
}

/** A 24-hour `HH:MM` as a clock shows it: "06:30" → "6:30 AM". */
export function formatTime(time: string): string {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const suffix = hours < 12 ? "AM" : "PM";
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}
