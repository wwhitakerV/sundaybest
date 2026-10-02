/** A calendar date's weekday, short: `2026-09-22` → `Tue`. Read in UTC, as dates are stored. */
export function formatWeekday(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
}
