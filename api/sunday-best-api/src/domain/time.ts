import { AppError } from "../http/errors.js";

export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function localDateInTimeZone(now: Date, timeZone: string): string {
  if (!isValidTimeZone(timeZone)) throw new AppError("VALIDATION_FAILED", "Invalid X-Client-Timezone");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  if (!year || !month || !day) throw new AppError("INTERNAL", "Could not derive local date");
  return `${year}-${month}-${day}`;
}

export function addCalendarDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) throw new AppError("INTERNAL", "Invalid stored date");
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}


export function startOfWeekSunday(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) throw new AppError("VALIDATION_FAILED", "Invalid ISO date");
  const date = new Date(Date.UTC(year, month - 1, day));
  return addCalendarDays(isoDate, -date.getUTCDay());
}
