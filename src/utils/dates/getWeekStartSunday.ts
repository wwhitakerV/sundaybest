import { addDays } from "./addDays";

/** The Sunday that begins the week containing an ISO calendar date (`2026-09-23`). Worked in UTC, as dates are stored. */
export function getWeekStartSunday(date: string): string {
  return addDays(date, -new Date(`${date}T00:00:00.000Z`).getUTCDay());
}
