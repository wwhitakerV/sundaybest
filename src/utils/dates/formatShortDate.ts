/** A moment as a short date, month and day: `2026-09-05T07:05:00Z` → `Sep 5`. Read in UTC, as it's stored. */
export function formatShortDate(at: string): string {
  return new Date(at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
