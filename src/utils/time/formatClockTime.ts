/**
 * A 24-hour `HH:MM` as a clock shows it: "06:30" → "6:30 AM" — or, on a
 * 24-hour clock, as it's kept: "06:30".
 */
export function formatClockTime(
  time: string,
  { twentyFourHour = false }: { twentyFourHour?: boolean } = {},
): string {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const mm = String(minutes).padStart(2, "0");
  if (twentyFourHour) return `${String(hours).padStart(2, "0")}:${mm}`;
  const suffix = hours < 12 ? "AM" : "PM";
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour}:${mm} ${suffix}`;
}
