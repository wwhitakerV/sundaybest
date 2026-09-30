/** A day as month, day, and year, two digits each, parted by dots: `2026-09-30` → `09.30.26`. */
export function formatDotDate(day: string): string {
  const [year = "", month = "", date = ""] = day.slice(0, 10).split("-");
  return `${month}.${date}.${year.slice(-2)}`;
}
