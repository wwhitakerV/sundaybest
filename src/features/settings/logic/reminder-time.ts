/** A reminder's time of day ("06:30") as today's date at that time, on this iPhone's clock. */
export function dateForTime(time: string): Date {
  const [hour, minute] = time.split(":");
  const date = new Date();
  date.setHours(Number(hour || "8"), Number(minute || "0"), 0, 0);
  return date;
}

/** A date's time of day as the API keeps it: "07:05". */
export function toLocalTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
