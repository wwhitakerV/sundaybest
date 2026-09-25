/** An ISO calendar date (`2026-09-23`) moved by `days` — negative goes back. Worked in UTC, as dates are stored. */
export function addDays(date: string, days: number): string {
  const moved = new Date(`${date}T00:00:00.000Z`);
  moved.setUTCDate(moved.getUTCDate() + days);
  return moved.toISOString().slice(0, 10);
}
